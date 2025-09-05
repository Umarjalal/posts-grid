<?php
/**
 * Plugin Name: Generic Posts Elementor Widget
 * Description: Elementor widget with post type, Elementor template rendering, AJAX search, filters, ACF fields, and pagination.
 * Version: 1.0.3
 * Author: Hussnain
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'GPW_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'GPW_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'GPW_VERSION', '1.0.3' );

// Register widget
add_action( 'elementor/widgets/register', function( $widgets_manager ) {
    require_once GPW_PLUGIN_DIR . 'widgets/class-generic-posts-widget.php';
    $widgets_manager->register( new \Generic_Posts_Widget() );
});

// Enqueue scripts and styles
add_action( 'wp_enqueue_scripts', function() {
    // CSS
    $css_file = GPW_PLUGIN_DIR . 'assets/css/generic-posts-widget.css';
    $css_ver  = file_exists( $css_file ) ? filemtime( $css_file ) : GPW_VERSION;

    wp_enqueue_style(
        'generic-posts-widget',
        GPW_PLUGIN_URL . 'assets/css/generic-posts-widget.css',
        [],
        $css_ver
    );

    // JS
    $js_file = GPW_PLUGIN_DIR . 'assets/js/generic-posts-widget.js';
    $js_ver  = file_exists( $js_file ) ? filemtime( $js_file ) : GPW_VERSION;

    wp_enqueue_script(
        'generic-posts-widget',
        GPW_PLUGIN_URL . 'assets/js/generic-posts-widget.js',
        ['jquery'],
        $js_ver,
        true
    );

    wp_localize_script( 'generic-posts-widget', 'GPW_Ajax', [
        'ajax_url' => admin_url( 'admin-ajax.php' ),
        'nonce'    => wp_create_nonce( 'gpw_nonce' ),
    ] );

    // Fancybox
    wp_enqueue_style(
        'fancybox-css',
        'https://cdn.jsdelivr.net/npm/@fancyapps/ui@6.0/dist/fancybox/fancybox.css',
        [],
        '6.0'
    );

    wp_enqueue_script(
        'fancybox-js',
        'https://cdn.jsdelivr.net/npm/@fancyapps/ui@6.0/dist/fancybox/fancybox.umd.js',
        [],
        '6.0',
        true
    );

    wp_add_inline_script(
        'fancybox-js',
        'Fancybox.bind("[data-fancybox]", {
            Carousel: { Video: { autoplay: true } }
        });'
    );
});



add_action('wp_ajax_gpw_filter_posts', 'gpw_filter_posts');
add_action('wp_ajax_nopriv_gpw_filter_posts', 'gpw_filter_posts');

// Add caching headers for better performance
add_action('wp_ajax_gpw_filter_posts', 'gpw_add_cache_headers');
add_action('wp_ajax_nopriv_gpw_filter_posts', 'gpw_add_cache_headers');

function gpw_add_cache_headers() {
    if (!headers_sent()) {
        header('Cache-Control: public, max-age=300'); // 5 minutes cache
        header('Vary: Accept-Encoding');
    }
}

function gpw_filter_posts() {
    check_ajax_referer('gpw_nonce', 'nonce');

    global $wpdb;

    // Optimize memory usage
    if (function_exists('wp_suspend_cache_addition')) {
        wp_suspend_cache_addition(true);
    }

    $post_type        = sanitize_text_field($_POST['post_type'] ?? 'post');
    $posts_per_page   = intval($_POST['posts_per_page'] ?? 6);
    $paged            = intval($_POST['paged'] ?? 1);
    $search_term      = sanitize_text_field($_POST['search'] ?? '');
    $search_in_acf    = sanitize_text_field($_POST['search_in_acf'] ?? 'no');
    $search_in_title  = sanitize_text_field($_POST['search_in_title'] ?? 'yes');
    $search_in_content = sanitize_text_field($_POST['search_in_content'] ?? 'yes');
    $acf_filters      = $_POST['acf'] ?? [];
    $tax_filters      = $_POST['tax'] ?? [];
    $date_from        = sanitize_text_field($_POST['date_from'] ?? '');
    $date_to          = sanitize_text_field($_POST['date_to'] ?? '');
    $template_id      = sanitize_text_field($_POST['template_id'] ?? '');
    $empty_template_id = sanitize_text_field($_POST['empty_template_id'] ?? '');

    // Create cache key for query caching
    $cache_key = 'gpw_query_' . md5(serialize([
        $post_type, $posts_per_page, $paged, $search_term, 
        $acf_filters, $tax_filters, $date_from, $date_to
    ]));
    
    // Try to get cached result
    $cached_result = wp_cache_get($cache_key, 'gpw_queries');
    if ($cached_result !== false) {
        wp_send_json_success($cached_result);
        return;
    }


    $args = [
        'post_type'      => $post_type,
        'posts_per_page' => $posts_per_page,
        'paged'          => $paged,
        'post_status'    => 'publish',
        'no_found_rows'  => false, // We need found_rows for pagination
        'update_post_meta_cache' => false, // Optimize if not using meta
        'update_post_term_cache' => false, // Optimize if not using terms
    ];

    $meta_query = [];

    // ACF filters with optimization
    if (!empty($acf_filters)) {
        foreach ($acf_filters as $field_key => $value) {
            if (!empty($value)) {
                if (is_array($value)) {
                    $value = array_map('sanitize_text_field', $value);
                    $meta_query[] = [
                        'key'     => sanitize_key($field_key),
                        'value'   => $value,
                        'compare' => 'IN',
                    ];
                } else {
                    $meta_query[] = [
                        'key'     => sanitize_key($field_key),
                        'value'   => sanitize_text_field($value),
                        'compare' => 'LIKE',
                    ];
                }
            }
        }
    }

    // Optimized taxonomy filters
if (!empty($tax_filters)) {
    $tax_query = ['relation' => 'AND'];
    
    foreach ($tax_filters as $taxonomy => $terms) {
        if (!empty($terms)) {
            if (is_array($terms)) {
                $filtered_terms = array_filter($terms, function($term) {
                    return $term !== 'all' && !empty($term);
                });
                $filtered_terms = array_map('sanitize_title', $filtered_terms);
            } else {
                $filtered_terms = ($terms !== 'all' && !empty($terms)) ? [sanitize_title($terms)] : [];
            }
            
            if (!empty($filtered_terms)) {
                $tax_query[] = [
                    'taxonomy' => sanitize_key($taxonomy),
                    'field'    => 'slug',
                    'terms'    => $filtered_terms,
                ];
            }
        }
    }
    
    if (count($tax_query) > 1) {
        $args['tax_query'] = $tax_query;
    }
}

    // Optimized date filters
    if ($date_from || $date_to) {
        $date_query = [];
        if ($date_from) {
            $date_query['after'] = sanitize_text_field($date_from);
        }
        if ($date_to) {
            $date_query['before'] = sanitize_text_field($date_to);
        }
        if ($date_query) {
            $date_query['inclusive'] = true;
            $args['date_query'][] = $date_query;
        }
    }

    if (!empty($meta_query)) {
        if (count($meta_query) > 1) {
            $meta_query['relation'] = 'AND';
        }
        $args['meta_query'] = $meta_query;
    }

    // Optimized search functionality
    if (!empty($search_term)) {
        add_filter('posts_where', function ($where, $query) use ($wpdb, $search_term, $search_in_acf, $search_in_title, $search_in_content, $post_type) {
            if ($query->get('post_type') !== $post_type) {
                return $where;
            }

            $like = '%' . $wpdb->esc_like($search_term) . '%';
            $search_conditions = [];

            if ($search_in_title === 'yes') {
                $search_conditions[] = $wpdb->prepare("{$wpdb->posts}.post_title LIKE %s", $like);
            }
            
            if ($search_in_content === 'yes') {
                $search_conditions[] = $wpdb->prepare("{$wpdb->posts}.post_content LIKE %s", $like);
            }

            if ($search_in_acf === 'yes') {
                $search_conditions[] = $wpdb->prepare("EXISTS (
                        SELECT 1 FROM {$wpdb->postmeta} pm
                        WHERE pm.post_id = {$wpdb->posts}.ID
                        AND pm.meta_value LIKE %s
                    )", $like);
            }

            if (!empty($search_conditions)) {
                $where .= " AND (" . implode(' OR ', $search_conditions) . ")";
            }

            return $where;
        }, 10, 2);
    }

    // Execute optimized query
    $query = new WP_Query($args);

    // Cache the result
    $result_data = [
        'max_pages'    => $query->max_num_pages,
        'found_posts'  => $query->found_posts,
        'current_page' => $paged,
    ];
    ob_start();

    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();

            if ($template_id) {
                // Use output buffering for better performance
                echo \Elementor\Plugin::instance()->frontend->get_builder_content_for_display($template_id, false);
            } else {
                // Optimized fallback layout
                echo '<div class="gpw-post">';
                if (has_post_thumbnail()) {
                    the_post_thumbnail('medium', ['loading' => 'lazy', 'decoding' => 'async']);
                }
                echo '<h3><a href="' . get_permalink() . '">' . get_the_title() . '</a></h3>';
                echo '<div class="gpw-excerpt">' . get_the_excerpt() . '</div>';
                echo '</div>';
            }
        }

        wp_reset_postdata();
        
        $result_data['html'] = ob_get_clean();
        
    } else {
        // Optimized empty state handling
        if ($empty_template_id) {
            $result_data['html'] = \Elementor\Plugin::instance()->frontend->get_builder_content_for_display($empty_template_id, false);
        } else {
            $result_data['html'] = '<div class="gpw-no-posts">
                <div class="gpw-no-posts-icon">📭</div>
                <h3 class="gpw-no-posts-title">No Posts Found</h3>
                <p class="gpw-no-posts-message">No posts match your current search criteria or filters.</p>
                <div class="gpw-no-posts-suggestions">
                    <p>Try:</p>
                    <ul>
                        <li>Adjusting your search terms</li>
                        <li>Clearing some filters</li>
                        <li>Checking different date ranges</li>
                    </ul>
                </div>
            </div>';
        }
        
        ob_end_clean();
    }
    
    // Cache the result for 5 minutes
    wp_cache_set($cache_key, $result_data, 'gpw_queries', 300);
    
    // Re-enable cache addition
    if (function_exists('wp_suspend_cache_addition')) {
        wp_suspend_cache_addition(false);
    }
    
    wp_send_json_success($result_data);
}
