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


function gpw_filter_posts() {
    check_ajax_referer('gpw_nonce', 'nonce');

    global $wpdb;

    $post_type        = sanitize_text_field($_POST['post_type'] ?? 'post');
    $posts_per_page   = intval($_POST['posts_per_page'] ?? 6);
    $paged            = intval($_POST['paged'] ?? 1); // ✅ Fixed from 'page' to 'paged'
    $search_term      = sanitize_text_field($_POST['search'] ?? '');
    $search_in_acf    = sanitize_text_field($_POST['search_in_acf'] ?? 'no');
    $acf_filters      = $_POST['acf'] ?? [];
    $tax_filters      = $_POST['tax'] ?? [];
    $date_from        = sanitize_text_field($_POST['date_from'] ?? '');
    $date_to          = sanitize_text_field($_POST['date_to'] ?? '');
    $template_id      = sanitize_text_field($_POST['template_id'] ?? '');
    $empty_template_id = sanitize_text_field($_POST['empty_template_id'] ?? '');



    $args = [
        'post_type'      => $post_type,
        'posts_per_page' => $posts_per_page,
        'paged'          => $paged, // ✅ Proper pagination
        'post_status'    => 'publish',
    ];

    $meta_query = [];

    // ✅ ACF filters
    if (!empty($acf_filters)) {
        foreach ($acf_filters as $field_key => $value) {
            if (!empty($value)) {
                // Handle different ACF field types
                if (is_array($value)) {
                    // Multiple values (checkbox, multi-select)
                    $meta_query[] = [
                        'key'     => sanitize_key($field_key),
                        'value'   => $value,
                        'compare' => 'IN',
                    ];
                } else {
                    // Single value (text, select, radio)
                    $meta_query[] = [
                        'key'     => sanitize_key($field_key),
                        'value'   => $value,
                        'compare' => 'LIKE',
                    ];
                }
            }
        }
    }

// ✅ Taxonomy filters - FIXED VERSION
if (!empty($tax_filters)) {
    $tax_query = ['relation' => 'AND'];
    
    foreach ($tax_filters as $taxonomy => $terms) {
        if (!empty($terms)) {
            // Handle both single terms and arrays of terms
            if (is_array($terms)) {
                $filtered_terms = array_filter($terms, function($term) {
                    return $term !== 'all' && !empty($term);
                });
            } else {
                $filtered_terms = ($terms !== 'all' && !empty($terms)) ? [$terms] : [];
            }
            
            if (!empty($filtered_terms)) {
                $tax_query[] = [
                    'taxonomy' => sanitize_key($taxonomy),
                    'field'    => 'slug',
                    'terms'    => array_map('sanitize_title', $filtered_terms),
                ];
            }
        }
    }
    
    // Only add tax_query if we have actual conditions
    if (count($tax_query) > 1) {
        $args['tax_query'] = $tax_query;
    }
}

    // ✅ Date filters
    if ($date_from || $date_to) {
        $date_query = [];
        if ($date_from) {
            $date_query['after'] = $date_from;
        }
        if ($date_to) {
            $date_query['before'] = $date_to;
        }
        if ($date_query) {
            $date_query['inclusive'] = true;
            $args['date_query'][] = $date_query;
        }
    }

    if (!empty($meta_query)) {
        $args['meta_query'] = $meta_query;
    }



    // ✅ Custom WHERE clause for search
    if (!empty($search_term)) {
        add_filter('posts_where', function ($where, $query) use ($wpdb, $search_term, $search_in_acf, $post_type) {
            if ($query->get('post_type') !== $post_type) {
                return $where;
            }

            $like = '%' . $wpdb->esc_like($search_term) . '%';

            // Search in title + content
            $where .= $wpdb->prepare(" AND (
                {$wpdb->posts}.post_title LIKE %s 
                OR {$wpdb->posts}.post_content LIKE %s",
                $like, $like
            );

            // Also search in ACF fields if enabled
            if ($search_in_acf === 'yes') {
                $where .= $wpdb->prepare(" 
                    OR EXISTS (
                        SELECT 1 FROM {$wpdb->postmeta} pm
                        WHERE pm.post_id = {$wpdb->posts}.ID
                        AND pm.meta_value LIKE %s
                    )", $like
                );
            }

            $where .= ")";

            return $where;
        }, 10, 2);
    }

    // 🔎 Run query
    $query = new WP_Query($args);

    ob_start();

    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();

            if ($template_id) {
                echo \Elementor\Plugin::instance()->frontend->get_builder_content_for_display($template_id);
            } else {
                // Fallback basic layout
                echo '<div class="gpw-post">';
                the_post_thumbnail( 'medium', ['loading' => 'lazy'] );
                echo '<h3>' . get_the_title() . '</h3>';
                echo '</div>';
            }

        }

        wp_reset_postdata();

        $html = ob_get_clean();

        wp_send_json_success([
            'html'         => $html,
            'max_pages'    => $query->max_num_pages,
            'found_posts'  => $query->found_posts,
            'current_page' => $paged,
        ]);
        
    } else {
        // Handle empty state with template or default message
        if ($empty_template_id) {
            ob_start();
            echo \Elementor\Plugin::instance()->frontend->get_builder_content_for_display($empty_template_id, true);
            $empty_html = ob_get_clean();
        } else {
            $empty_html = '<div class="gpw-no-posts">
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

        wp_send_json_success([
            'html'         => $empty_html,
            'max_pages'    => 0,
            'found_posts'  => 0,
            'current_page' => $paged,
        ]);
    }
}

