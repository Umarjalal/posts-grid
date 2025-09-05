<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class Generic_Posts_Widget extends \Elementor\Widget_Base {

    public function get_name() {
        return 'generic_posts_widget';
    }

    public function get_title() {
        return 'Generic Posts Widget';
    }

    public function get_icon() {
        return 'eicon-post-list';
    }

    public function get_categories() {
        return [ 'general' ];
    }

    protected function register_controls() {
        // Content Section
        $this->start_controls_section( 'content_section', [
            'label' => 'Content Settings',
            'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
        ] );

        $this->add_control( 'post_type', [
            'label'   => 'Post Type',
            'type'    => \Elementor\Controls_Manager::SELECT,
            'options' => $this->get_post_types(),
            'default' => 'post',
        ] );

        $this->add_control( 'posts_per_page', [
            'label'   => 'Posts Per Page',
            'type'    => \Elementor\Controls_Manager::NUMBER,
            'default' => 6,
            'min'     => 1,
            'max'     => 50,
        ] );

        $this->add_control( 'grid_columns', [
            'label'   => 'Grid Columns',
            'type'    => \Elementor\Controls_Manager::SELECT,
            'options' => [
                '1' => '1 Column',
                '2' => '2 Columns',
                '3' => '3 Columns',
                '4' => '4 Columns',
                '5' => '5 Columns',
                '6' => '6 Columns',
            ],
            'default' => '3',
        ] );

        $this->add_control( 'grid_columns_tablet', [
            'label'   => 'Grid Columns (Tablet)',
            'type'    => \Elementor\Controls_Manager::SELECT,
            'options' => [
                '1' => '1 Column',
                '2' => '2 Columns',
                '3' => '3 Columns',
                '4' => '4 Columns',
            ],
            'default' => '2',
        ] );

        $this->add_control( 'grid_columns_mobile', [
            'label'   => 'Grid Columns (Mobile)',
            'type'    => \Elementor\Controls_Manager::SELECT,
            'options' => [
                '1' => '1 Column',
                '2' => '2 Columns',
            ],
            'default' => '1',
        ] );

        $this->add_control( 'template_id', [
            'label'   => 'Elementor Template',
            'type'    => \Elementor\Controls_Manager::SELECT,
            'options' => $this->get_elementor_templates(),
            'description' => 'Select an Elementor template to render each post',
        ] );

        $this->add_control( 'empty_template_id', [
            'label'   => 'Empty Posts Template',
            'type'    => \Elementor\Controls_Manager::SELECT,
            'options' => $this->get_elementor_templates(),
            'description' => 'Select an Elementor template to display when no posts are found',
        ] );

        $this->end_controls_section();

        // Search Section
        $this->start_controls_section( 'search_section', [
            'label' => 'Search Settings',
            'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
        ] );

        $this->add_control( 'show_search', [
            'label'   => 'Show Search Bar',
            'type'    => \Elementor\Controls_Manager::SWITCHER,
            'default' => 'yes',
        ] );

        $this->add_control( 'show_confirm_button', [
            'label'   => 'Show Confirm Button',
            'type'    => \Elementor\Controls_Manager::SWITCHER,
            'default' => 'yes',
            'description' => 'Show confirm button to apply filters',
        ] );

        $this->add_control( 'confirm_button_text', [
            'label'     => 'Confirm Button Text',
            'type'      => \Elementor\Controls_Manager::TEXT,
            'default'   => 'CONFIRM',
            'condition' => [
                'show_confirm_button' => 'yes',
            ],
        ] );

        $this->add_control( 'reset_button_text', [
            'label'     => 'Reset Button Text',
            'type'      => \Elementor\Controls_Manager::TEXT,
            'default'   => 'RESET ALL FILTERS',
            'condition' => [
                'show_confirm_button' => 'yes',
            ],
        ] );

        $this->add_control( 'search_placeholder', [
            'label'     => 'Search Placeholder',
            'type'      => \Elementor\Controls_Manager::TEXT,
            'default'   => 'Search posts...',
            'condition' => [
                'show_search' => 'yes',
            ],
        ] );

        $this->add_control( 'search_in_title', [
            'label'     => 'Search in Post Title',
            'type'      => \Elementor\Controls_Manager::SWITCHER,
            'default'   => 'yes',
            'condition' => [
                'show_search' => 'yes',
            ],
        ] );

        $this->add_control( 'search_in_content', [
            'label'     => 'Search in Post Content',
            'type'      => \Elementor\Controls_Manager::SWITCHER,
            'default'   => 'yes',
            'condition' => [
                'show_search' => 'yes',
            ],
        ] );

        $this->add_control( 'search_in_acf', [
            'label'     => 'Search in ACF Fields',
            'type'      => \Elementor\Controls_Manager::SWITCHER,
            'default'   => 'yes',
            'condition' => [
                'show_search' => 'yes',
            ],
        ] );

        $this->end_controls_section();



        // Filters Section
        $this->start_controls_section( 'filters_section', [
            'label' => 'Additional Filters',
            'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
        ] );

        $this->add_control( 'show_date_filter', [
            'label'   => 'Show Date Filter',
            'type'    => \Elementor\Controls_Manager::SWITCHER,
            'default' => 'yes',
        ] );

        $this->add_control( 'date_filter_label', [
            'label'     => 'Date Filter Label',
            'type'      => \Elementor\Controls_Manager::TEXT,
            'default'   => 'Published Date Range',
            'condition' => [
                'show_date_filter' => 'yes',
            ],
        ] );

        $this->add_control( 'date_from_label', [
            'label'     => 'Date From Label',
            'type'      => \Elementor\Controls_Manager::TEXT,
            'default'   => 'From',
            'condition' => [
                'show_date_filter' => 'yes',
            ],
        ] );

        $this->add_control( 'date_to_label', [
            'label'     => 'Date To Label',
            'type'      => \Elementor\Controls_Manager::TEXT,
            'default'   => 'To',
            'condition' => [
                'show_date_filter' => 'yes',
            ],
        ] );

        $this->add_control( 'show_taxonomy_filters', [
            'label'   => 'Show Taxonomy Filters',
            'type'    => \Elementor\Controls_Manager::SWITCHER,
            'default' => 'yes',
        ] );

        $this->add_control( 'taxonomy_filters', [
            'label'     => 'Taxonomies to Filter',
            'type'      => \Elementor\Controls_Manager::REPEATER,
            'fields'    => [
                [
                    'name'        => 'taxonomy',
                    'label'       => 'Taxonomy',
                    'type'        => \Elementor\Controls_Manager::SELECT,
                    'options'     => $this->get_taxonomies(),
                ],
                [
                    'name'        => 'taxonomy_label',
                    'label'       => 'Taxonomy Label',
                    'type'        => \Elementor\Controls_Manager::TEXT,
                    'description' => 'Display label for the taxonomy',
                ],
            ],
            'condition' => [
                'show_taxonomy_filters' => 'yes',
            ],
        ] );

        $this->add_control( 'show_acf_filters', [
            'label'   => 'Show ACF Field Filters',
            'type'    => \Elementor\Controls_Manager::SWITCHER,
            'default' => 'yes',
        ] );

        $this->add_control( 'acf_fields', [
            'label'     => 'ACF Fields to Display',
            'type'      => \Elementor\Controls_Manager::REPEATER,
            'fields'    => [
                [
                    'name'        => 'field_name',
                    'label'       => 'Field Name',
                    'type'        => \Elementor\Controls_Manager::TEXT,
                    'description' => 'Enter the ACF field name (e.g., location, category)',
                ],
                [
                    'name'        => 'field_label',
                    'label'       => 'Field Label',
                    'type'        => \Elementor\Controls_Manager::TEXT,
                    'description' => 'Display label for the field',
                ],
                [
                    'name'        => 'field_type',
                    'label'       => 'Field Type',
                    'type'        => \Elementor\Controls_Manager::SELECT,
                    'options'     => [
                        'text'     => 'Text Input',
                        'select'   => 'Dropdown Select',
                        'checkbox' => 'Checkbox',
                        'radio'    => 'Radio Buttons',
                        'date'     => 'Date Picker',
                    ],
                    'default'     => 'select',
                ],
                [
                    'name'        => 'field_options',
                    'label'       => 'Field Options (one per line)',
                    'type'        => \Elementor\Controls_Manager::TEXTAREA,
                    'description' => 'For select/radio/checkbox fields, enter options one per line. Leave empty to auto-detect values from your ACF field.',
                    'condition'   => [
                        'field_type' => ['select', 'checkbox', 'radio'],
                    ],
                ],
            ],
            'condition' => [
                'show_acf_filters' => 'yes',
            ],
        ] );

        $this->end_controls_section();

        // Pagination Section
        $this->start_controls_section( 'pagination_section', [
            'label' => 'Pagination',
            'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
        ] );

        $this->add_control( 'show_pagination', [
            'label'   => 'Show Pagination',
            'type'    => \Elementor\Controls_Manager::SWITCHER,
            'default' => 'yes',
        ] );

        $this->add_control( 'pagination_type', [
            'label'     => 'Pagination Type',
            'type'      => \Elementor\Controls_Manager::SELECT,
            'options'   => [
                'numbers'     => 'Page Numbers',
                'prev_next'   => 'Previous/Next',
                'load_more'   => 'Load More Button',
                'infinite'    => 'Infinite Scroll',
            ],
            'default'   => 'numbers',
            'condition' => [
                'show_pagination' => 'yes',
            ],
        ] );

        $this->add_control( 'load_more_text', [
            'label'     => 'Load More Button Text',
            'type'      => \Elementor\Controls_Manager::TEXT,
            'default'   => 'Load More Posts',
            'condition' => [
                'show_pagination' => 'yes',
                'pagination_type' => 'load_more',
            ],
        ] );

        $this->end_controls_section();

        // Skeleton Section
        $this->start_controls_section( 'skeleton_section', [
            'label' => 'Loading Skeleton',
            'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
        ] );

        $this->add_control( 'show_skeleton', [
            'label'   => 'Show Loading Skeleton',
            'type'    => \Elementor\Controls_Manager::SWITCHER,
            'default' => 'yes',
        ] );

        $this->add_control( 'skeleton_image', [
            'label'     => 'Show Skeleton Image',
            'type'      => \Elementor\Controls_Manager::SWITCHER,
            'default'   => 'yes',
            'condition' => [
                'show_skeleton' => 'yes',
            ],
        ] );

        $this->add_control( 'skeleton_title', [
            'label'     => 'Show Skeleton Title',
            'type'      => \Elementor\Controls_Manager::SWITCHER,
            'default'   => 'yes',
            'condition' => [
                'show_skeleton' => 'yes',
            ],
        ] );

        $this->add_control( 'skeleton_excerpt', [
            'label'     => 'Show Skeleton Excerpt',
            'type'      => \Elementor\Controls_Manager::SWITCHER,
            'default'   => 'yes',
            'condition' => [
                'show_skeleton' => 'yes',
            ],
        ] );

        $this->add_control( 'skeleton_meta', [
            'label'     => 'Show Skeleton Meta',
            'type'      => \Elementor\Controls_Manager::SWITCHER,
            'default'   => 'yes',
            'condition' => [
                'show_skeleton' => 'yes',
            ],
        ] );

        $this->add_control( 'skeleton_lines', [
            'label'     => 'Skeleton Excerpt Lines',
            'type'      => \Elementor\Controls_Manager::NUMBER,
            'default'   => 3,
            'min'       => 1,
            'max'       => 5,
            'condition' => [
                'show_skeleton' => 'yes',
                'skeleton_excerpt' => 'yes',
            ],
        ] );

        $this->add_control( 'skeleton_layout', [
            'label'     => 'Skeleton Layout',
            'type'      => \Elementor\Controls_Manager::SELECT,
            'options'   => [
                'image-top'    => 'Image on Top',
                'image-left'   => 'Image on Left',
                'image-right'  => 'Image on Right',
                'image-bottom' => 'Image on Bottom',
                'no-image'     => 'No Image',
            ],
            'default'   => 'image-top',
            'condition' => [
                'show_skeleton' => 'yes',
                'skeleton_image' => 'yes',
            ],
        ] );

        $this->add_control( 'skeleton_content_order', [
            'label'     => 'Content Order',
            'type'      => \Elementor\Controls_Manager::REPEATER,
            'fields'    => [
                [
                    'name'        => 'element',
                    'label'       => 'Element',
                    'type'        => \Elementor\Controls_Manager::SELECT,
                    'options'     => [
                        'title'   => 'Title',
                        'excerpt' => 'Excerpt',
                        'meta'    => 'Meta',
                    ],
                    'default'     => 'title',
                ],
            ],
            'default'   => [
                ['element' => 'title'],
                ['element' => 'excerpt'],
                ['element' => 'meta'],
            ],
            'title_field' => '{{{ element }}}',
            'condition' => [
                'show_skeleton' => 'yes',
            ],
        ] );

        $this->end_controls_section();

        // Style Section
        $this->start_controls_section( 'style_section', [
            'label' => 'Style',
            'tab'   => \Elementor\Controls_Manager::TAB_STYLE,
        ] );

        $this->add_control( 'filters_layout', [
            'label'   => 'Filters Layout',
            'type'    => \Elementor\Controls_Manager::SELECT,
            'options' => [
                'accordion'  => 'Accordion',
                'horizontal' => 'Horizontal',
                'vertical'   => 'Vertical',
                'grid'       => 'Grid',
            ],
            'default' => 'accordion',
        ] );



        $this->add_control( 'filters_spacing', [
            'label'      => 'Filters Spacing',
            'type'       => \Elementor\Controls_Manager::SLIDER,
            'size_units' => ['px', 'em'],
            'range'      => [
                'px' => [
                    'min' => 0,
                    'max' => 50,
                ],
                'em' => [
                    'min' => 0,
                    'max' => 5,
                ],
            ],
            'default'    => [
                'unit' => 'px',
                'size' => 15,
            ],
            'selectors'  => [
                '{{WRAPPER}} .gpw-filter-item' => 'margin-bottom: {{SIZE}}{{UNIT}};',
            ],
        ] );

        $this->add_control( 'grid_column_gap', [
            'label'      => 'Grid Column Gap',
            'type'       => \Elementor\Controls_Manager::SLIDER,
            'size_units' => ['px', 'em'],
            'range'      => [
                'px' => [
                    'min' => 0,
                    'max' => 100,
                ],
                'em' => [
                    'min' => 0,
                    'max' => 10,
                ],
            ],
            'default'    => [
                'unit' => 'px',
                'size' => 30,
            ],
            'selectors'  => [
                '{{WRAPPER}} .gpw-posts-grid' => 'column-gap: {{SIZE}}{{UNIT}};',
            ],
        ] );

        $this->add_control( 'grid_row_gap', [
            'label'      => 'Grid Row Gap',
            'type'       => \Elementor\Controls_Manager::SLIDER,
            'size_units' => ['px', 'em'],
            'range'      => [
                'px' => [
                    'min' => 0,
                    'max' => 100,
                ],
                'em' => [
                    'min' => 0,
                    'max' => 10,
                ],
            ],
            'default'    => [
                'unit' => 'px',
                'size' => 30,
            ],
            'selectors'  => [
                '{{WRAPPER}} .gpw-posts-grid' => 'row-gap: {{SIZE}}{{UNIT}};',
            ],
        ] );

        $this->end_controls_section();
    }

    protected function render() {
        $settings = $this->get_settings_for_display();
        ?>
        <div class="gpw-wrapper" data-settings='<?php echo json_encode($settings); ?>'>
            <?php if ($settings['show_search'] === 'yes'): ?>
                <div class="gpw-search-wrapper">
                    <div class="page-title">
                        <h1><?php echo get_the_title(); ?></h1>
                    </div>

                    <div class="gpw-search-container">
                        <div class="gpw-search-label">
                            <?php echo esc_html($settings['search_label'] ?? 'SEARCH'); ?>
                        </div>
                        <div class="gpw-search-input-wrapper">
                            <div class="gpw-search-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                </svg>
                            </div>
                            <input type="text" class="gpw-search" placeholder="<?php echo esc_attr($settings['search_placeholder']); ?>">
                            <button type="button" class="gpw-search-clear" style="display: none;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <path d="M8.375 8.375L1.625 1.625" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                        </div>

                        <!-- Show Filters Button (when sidebar is hidden) -->
                        <div class="gpw-show-filters-wrapper">
                            <button type="button" class="gpw-show-filters-btn">
                                <span class="gpw-filter-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path d="M12.75 16.125L3.75 16.125" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M20.25 16.125L15.75 16.125" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M6.75 7.87507L3.75 7.875" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M20.25 7.875L9.75 7.87507" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M9.75 5.625V10.125" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M15.75 18.375V13.875" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </span>
                                <span class="gpw-filter-text">Show Filters</span>
                                <span class="gpw-filters-indicator" style="display: none;"></span>
                            </button>

                            <div class="toggle-container">
                                <button id="lightToggle" class="toggle-btn inactive" aria-label="Light Mode">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <g clip-path="url(#clip0_13589_31492)">
                                            <path d="M12 17.625C15.1066 17.625 17.625 15.1066 17.625 12C17.625 8.8934 15.1066 6.375 12 6.375C8.8934 6.375 6.375 8.8934 6.375 12C6.375 15.1066 8.8934 17.625 12 17.625Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M12 3.375V1.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M5.902 5.90004L4.57617 4.57422" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M3.375 12H1.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M5.902 18.0977L4.57617 19.4235" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M12 20.625V22.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M18.0996 18.0977L19.4254 19.4235" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M20.625 12H22.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M18.0996 5.90004L19.4254 4.57422" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                        </g>
                                        <defs>
                                            <clipPath id="clip0_13589_31492">
                                                <rect width="24" height="24" fill="white"/>
                                            </clipPath>
                                        </defs>
                                    </svg>
                                </button>
                                <button id="darkToggle" class="toggle-btn active" aria-label="Dark Mode">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M20.3121 14.3105C18.8398 14.7196 17.2853 14.7303 15.8076 14.3417C14.3298 13.953 12.9817 13.1789 11.9012 12.0984C10.8207 11.0179 10.0466 9.66983 9.6579 8.19204C9.26923 6.71426 9.28 5.15976 9.6891 3.6875L9.68934 3.68757C8.23722 4.09154 6.91629 4.86894 5.85813 5.94233C4.79998 7.01571 4.04155 8.34763 3.65838 9.80537C3.27522 11.2631 3.2807 12.7958 3.67428 14.2508C4.06787 15.7058 4.83581 17.0322 5.90161 18.098C6.96741 19.1638 8.29387 19.9317 9.74885 20.3253C11.2038 20.7189 12.7365 20.7243 14.1943 20.3412C15.652 19.958 16.9839 19.1995 18.0573 18.1414C19.1307 17.0832 19.9081 15.7623 20.312 14.3101L20.3121 14.3105Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                <?php endif; ?>

                <div class="gpw-filters-wrapper gpw-filters-wrapper__sidebar">
                    <div class="gpw_filters_main-wrapper">
                        <div class="gpw-main-filter__wrapper">
                            <div class="gpw-selected-filters-header">
                                <div class="gpw-filters-header-content">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
                                        <path d="M17 21.5L5 21.5" stroke="#001319" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M27 21.5L21 21.5" stroke="#001319" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M9 10.5001L5 10.5" stroke="#001319" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M27 10.5L13 10.5001" stroke="#001319" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M13 7.5V13.5" stroke="#001319" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M21 24.5V18.5" stroke="#001319" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                    <span class="filter-text">Filters</span>
                                </div>
                                <button type="button" class="gpw-filter-toggle-btn gpw-close-btn">
                                    <span class="gpw-filter-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path d="M18.75 5.25L5.25 18.75" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M18.75 18.75L5.25 5.25" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </span>
                                </button>
                            </div>
                            <!-- Selected Filters Display -->
                            <div class="gpw-selected-filters" style="display: none;">
                                <div class="gpw-selected-filters-tags"></div>
                            </div>

                            <?php if ($settings['show_acf_filters'] === 'yes' || $settings['show_date_filter'] === 'yes' || ($settings['show_taxonomy_filters'] === 'yes' && !empty($settings['taxonomy_filters']))): ?>
                                <?php if ($settings['filters_layout'] === 'accordion'): ?>
                                    <!-- ACF Fields in Separate Accordions -->
                                    <?php if ($settings['show_acf_filters'] === 'yes' && !empty($settings['acf_fields'])): ?>
                                        <?php foreach ($settings['acf_fields'] as $field): ?>
                                            <div class="gpw-filters-accordion">
                                                <div class="gpw-accordion-header">
                                                    <h3>
                                                        <?php echo esc_html($field['field_label']); ?>
                                                        <span class="gpw-accordion-count" data-field="<?php echo esc_attr($field['field_name']); ?>">0</span>
                                                    </h3>
                                                    <span class="gpw-accordion-toggle">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                            <path d="M8 2.5V13.5" stroke="#001319" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                            <path d="M3.5 9L8 13.5L12.5 9" stroke="#001319" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                        </svg>
                                                    </span>
                                                </div>
                                                <div class="gpw-accordion-content">
                                                    <div class="gpw-filter-item">
                                                        <?php echo $this->render_filter_field($field); ?>
                                                    </div>
                                                </div>
                                            </div>
                                        <?php endforeach; ?>
                                    <?php endif; ?>

                                    <!-- Date Filter in Separate Accordion -->
                                    <?php if ($settings['show_date_filter'] === 'yes'): ?>
                                        <div class="gpw-filters-accordion">
                                            <div class="gpw-accordion-header">
                                                <h3><?php echo esc_html($settings['date_filter_label']); ?></h3>
                                                <span class="gpw-accordion-toggle">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                        <path d="M8 2.5V13.5" stroke="#001319" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                        <path d="M3.5 9L8 13.5L12.5 9" stroke="#001319" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                    </svg>
                                                </span>
                                            </div>
                                            <div class="gpw-accordion-content">
                                                <div class="gpw-date-range">
                                                    <div class="gpw-date-input">
                                                        <label><?php echo esc_html($settings['date_from_label']); ?></label>
                                                        <input type="date" class="gpw-date-filter-from">
                                                    </div>
                                                    <div class="gpw-date-input">
                                                        <label><?php echo esc_html($settings['date_to_label']); ?></label>
                                                        <input type="date" class="gpw-date-filter-to">
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    <?php endif; ?>

                                    <!-- Taxonomy Filters in Separate Accordions -->
                                    <?php if ($settings['show_taxonomy_filters'] === 'yes' && !empty($settings['taxonomy_filters'])): ?>
                                        <?php foreach ($settings['taxonomy_filters'] as $tax_filter): ?>
                                            <div class="gpw-filters-accordion">
                                                <div class="gpw-accordion-header">
                                                    <h3>
                                                        <?php echo esc_html($tax_filter['taxonomy_label']); ?>
                                                        <span class="gpw-accordion-count" data-field="<?php echo esc_attr($tax_filter['taxonomy']); ?>">0</span>
                                                    </h3>
                                                    <span class="gpw-accordion-toggle">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                            <path d="M8 2.5V13.5" stroke="#001319" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                            <path d="M3.5 9L8 13.5L12.5 9" stroke="#001319" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                        </svg>
                                                    </span>
                                                </div>
                                                <div class="gpw-accordion-content">
                                                    <div class="gpw-filter-item">
                                                        <div class="gpw-checkbox-group">
                                                            <label><input type="checkbox" class="gpw-tax-filter" data-taxonomy="<?php echo esc_attr($tax_filter['taxonomy']); ?>" value="all"> All</label>
                                                            <?php echo $this->get_taxonomy_checkboxes($tax_filter['taxonomy']); ?>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        <?php endforeach; ?>
                                    <?php endif; ?>

                                    <!-- Confirm and Reset Buttons -->
                                    <?php if ($settings['show_confirm_button'] === 'yes'): ?>
                                        <div class="gpw-filter-actions">
                                            <button type="button" class="gpw-reset-filters">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                    <path d="M9.375 2.625L2.625 9.375" stroke="#001319" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                                    <path d="M9.375 9.375L2.625 2.625" stroke="#001319" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                                </svg>
                                                <?php echo esc_html($settings['reset_button_text']); ?>
                                            </button>
                                            <button type="button" class="gpw-confirm-filters"><?php echo esc_html($settings['confirm_button_text']); ?></button>
                                        </div>
                                    <?php endif; ?>
                                <?php else: ?>
                                    <?php if ($settings['show_acf_filters'] === 'yes' && !empty($settings['acf_fields'])): ?>
                                        <div class="gpw-filters gpw-filters-<?php echo esc_attr($settings['filters_layout']); ?>">
                                            <?php foreach ($settings['acf_fields'] as $field): ?>
                                                <div class="gpw-filter-item">
                                                    <label><?php echo esc_html($field['field_label']); ?></label>
                                                    <?php echo $this->render_filter_field($field); ?>
                                                </div>
                                            <?php endforeach; ?>
                                        </div>
                                    <?php endif; ?>

                                    <?php if ($settings['show_date_filter'] === 'yes'): ?>
                                        <div class="gpw-filter-item">
                                            <label><?php echo esc_html($settings['date_filter_label']); ?></label>
                                            <div class="gpw-date-range">
                                                <div class="gpw-date-input">
                                                    <label><?php echo esc_html($settings['date_from_label']); ?></label>
                                                    <input type="date" class="gpw-date-filter-from">
                                                </div>
                                                <div class="gpw-date-input">
                                                    <label><?php echo esc_html($settings['date_to_label']); ?></label>
                                                    <input type="date" class="gpw-date-filter-to">
                                                </div>
                                            </div>
                                        </div>
                                    <?php endif; ?>

                                    <?php if ($settings['show_taxonomy_filters'] === 'yes' && !empty($settings['taxonomy_filters'])): ?>
                                        <div class="gpw-filters gpw-filters-<?php echo esc_attr($settings['filters_layout']); ?>">
                                            <?php foreach ($settings['taxonomy_filters'] as $tax_filter): ?>
                                                <div class="gpw-filter-item">
                                                    <label><?php echo esc_html($tax_filter['taxonomy_label']); ?></label>
                                                    <select class="gpw-tax-filter" data-taxonomy="<?php echo esc_attr($tax_filter['taxonomy']); ?>">
                                                        <option value="">All</option>
                                                        <?php echo $this->get_taxonomy_options($tax_filter['taxonomy']); ?>
                                                    </select>
                                                </div>
                                            <?php endforeach; ?>
                                        </div>
                                    <?php endif; ?>
                                <?php endif; ?>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
                <div class="gpw-results">
                    <div class="gpw-posts-grid gpw-grid-<?php echo esc_attr($settings['grid_columns']); ?> gpw-grid-tablet-<?php echo esc_attr($settings['grid_columns_tablet']); ?> gpw-grid-mobile-<?php echo esc_attr($settings['grid_columns_mobile']); ?>"></div>
                </div>

                <?php if ($settings['show_pagination'] === 'yes'): ?>
                    <div class="gpw-pagination gpw-pagination-<?php echo esc_attr($settings['pagination_type']); ?>"></div>
                <?php endif; ?>
            </div>
    <?php
    }

    private function render_filter_field( $field ) {
        $field_name = $field['field_name'];
        $field_type = $field['field_type'];
        $options = [];

        // First try to get options from field_options (manual input)
        if ( ! empty( $field['field_options'] ) ) {
            $options = array_filter( array_map( 'trim', explode( "\n", $field['field_options'] ) ) );
        }
        
        // If no manual options, try to get dynamic values from ACF field
        if ( empty( $options ) && in_array( $field_type, ['select', 'checkbox', 'radio'] ) ) {
            $options = $this->get_acf_field_values( $field_name );
        }
        
        // If still no options, provide a helpful message
        if ( empty( $options ) && in_array( $field_type, ['select', 'checkbox', 'radio'] ) ) {
            return '<div class="gpw-no-options">No options available for this field. Please add options in the widget settings or ensure the ACF field has choices defined.</div>';
        }
        
        switch ( $field_type ) {
            case 'select':
                $html = '<select class="gpw-acf-filter" data-field="' . esc_attr( $field_name ) . '">';
                $html .= '<option value="">All</option>';
                foreach ( $options as $option ) {
                    $html .= '<option value="' . esc_attr( $option ) . '">' . esc_html( $option ) . '</option>';
                }
                $html .= '</select>';
                return $html;

            case 'checkbox':
                $html = '<div class="gpw-checkbox-group">';
                foreach ( $options as $option ) {
                    $html .= '<label><input type="checkbox" class="gpw-acf-filter" data-field="' . esc_attr( $field_name ) . '" value="' . esc_attr( $option ) . '"> ' . esc_html( $option ) . '</label>';
                }
                $html .= '</div>';
                return $html;

            case 'radio':
                $html = '<div class="gpw-radio-group">';
                foreach ( $options as $option ) {
                    $html .= '<label><input type="radio" name="gpw_' . esc_attr( $field_name ) . '" class="gpw-acf-filter" data-field="' . esc_attr( $field_name ) . '" value="' . esc_attr( $option ) . '"> ' . esc_html( $option ) . '</label>';
                }
                $html .= '</div>';
                return $html;

            case 'date':
                return '<input type="date" class="gpw-acf-filter" data-field="' . esc_attr( $field_name ) . '">';

            default:
                return '<input type="text" class="gpw-acf-filter" data-field="' . esc_attr( $field_name ) . '" placeholder="Enter ' . esc_attr( $field['field_label'] ) . '">';
        }
    }

    private function get_post_types() {
        $post_types = get_post_types( [ 'public' => true ], 'objects' );
        $options = [];
        foreach ( $post_types as $pt ) {
            $options[ $pt->name ] = $pt->label;
        }
        return $options;
    }

    private function get_elementor_templates() {
        $templates = get_posts([
            'post_type'      => 'elementor_library',
            'posts_per_page' => -1
        ]);
        $options = [ '' => 'Default Layout' ];
        foreach ( $templates as $tpl ) {
            $options[ $tpl->ID ] = $tpl->post_title;
        }
        return $options;
    }

    private function get_taxonomies() {
        $taxonomies = get_taxonomies( [ 'public' => true ], 'objects' );
        $options = [];
        foreach ( $taxonomies as $tax ) {
            $options[ $tax->name ] = $tax->label;
        }
        return $options;
    }

    private function get_taxonomy_options( $taxonomy ) {
        $terms = get_terms([
            'taxonomy'   => $taxonomy,
            'hide_empty' => true,
        ]);

        if ( is_wp_error( $terms ) ) {
            return '';
        }

        $html = '';
        foreach ( $terms as $term ) {
            $html .= '<option value="' . esc_attr( $term->slug ) . '">' . esc_html( $term->name ) . '</option>';
        }
        return $html;
    }

    private function get_taxonomy_checkboxes( $taxonomy ) {
        $terms = get_terms([
            'taxonomy'   => $taxonomy,
            'hide_empty' => true,
        ]);

        if ( is_wp_error( $terms ) ) {
            return '';
        }

        $html = '';
        foreach ( $terms as $term ) {
            $html .= '<label><input type="checkbox" class="gpw-tax-filter" data-taxonomy="' . esc_attr( $taxonomy ) . '" value="' . esc_attr( $term->slug ) . '"> ' . esc_html( $term->name ) . '</label>';
        }
        return $html;
    }

    /**
     * Get unique values from an ACF field across all posts
     */
    private function get_acf_field_values( $field_name ) {
        global $wpdb;
        
        // Get the current post type from the widget settings
        $settings = $this->get_settings_for_display();
        $post_type = $settings['post_type'] ?? 'post';
        
        $meta_values = [];
        
        // Method 1: Try ACF field object first (most reliable)
        if ( function_exists( 'acf_get_field' ) ) {
            $acf_field = acf_get_field( $field_name );
            if ( $acf_field && isset( $acf_field['choices'] ) && !empty( $acf_field['choices'] ) ) {
                $meta_values = array_keys( $acf_field['choices'] );
            }
        }
        
        // Method 2: Try to get values from existing posts using ACF functions
        if ( empty( $meta_values ) && function_exists( 'get_field' ) ) {
            $sample_posts = get_posts([
                'post_type' => $post_type,
                'posts_per_page' => 100,
                'post_status' => 'publish'
            ]);
            
            $temp_values = [];
            foreach ( $sample_posts as $post ) {
                $field_value = get_field( $field_name, $post->ID );
                if ( ! empty( $field_value ) ) {
                    if ( is_array( $field_value ) ) {
                        $temp_values = array_merge( $temp_values, $field_value );
                    } else {
                        $temp_values[] = $field_value;
                    }
                }
            }
            $meta_values = array_unique( $temp_values );
        }
        
        // Method 3: Try different meta key formats for ACF fields
        if ( empty( $meta_values ) ) {
            // ACF field keys can be in different formats
            $possible_keys = [
                $field_name,
                '_' . $field_name,
                'field_' . $field_name
            ];
            
            foreach ( $possible_keys as $key ) {
                $query_values = $wpdb->get_col(
                    $wpdb->prepare(
                        "SELECT DISTINCT meta_value 
                        FROM {$wpdb->postmeta} pm 
                        INNER JOIN {$wpdb->posts} p ON pm.post_id = p.ID 
                        WHERE pm.meta_key = %s 
                        AND p.post_type = %s 
                        AND p.post_status = 'publish'
                        AND pm.meta_value != ''
                        ORDER BY meta_value ASC",
                        $key,
                        $post_type
                    )
                );
                
                if ( !empty( $query_values ) ) {
                    $meta_values = $query_values;
                    break;
                }
            }
        }
        
        // Method 4: Try to find ACF fields by searching all field groups
        if ( empty( $meta_values ) && function_exists( 'acf_get_field_groups' ) ) {
            $field_groups = acf_get_field_groups();
            foreach ( $field_groups as $field_group ) {
                if ( $field_group['active'] ) {
                    $fields = acf_get_fields( $field_group );
                    if ( $fields ) {
                        foreach ( $fields as $field ) {
                            if ( $field['name'] === $field_name && isset( $field['choices'] ) ) {
                                $meta_values = array_keys( $field['choices'] );
                                break 2;
                            }
                        }
                    }
                }
            }
        }
        
        // Method 5: Try to find the field by searching all field groups for the exact name
        if ( empty( $meta_values ) && function_exists( 'acf_get_field_groups' ) ) {
            $field_groups = acf_get_field_groups();
            foreach ( $field_groups as $field_group ) {
                if ( $field_group['active'] ) {
                    $fields = acf_get_fields( $field_group );
                    if ( $fields ) {
                        foreach ( $fields as $field ) {
                            if ( $field['name'] === $field_name ) {
                                // Found the field, now get its values from posts
                                $post_values = $wpdb->get_col(
                                    $wpdb->prepare(
                                        "SELECT DISTINCT meta_value 
                                        FROM {$wpdb->postmeta} pm 
                                        INNER JOIN {$wpdb->posts} p ON pm.post_id = p.ID 
                                        WHERE pm.meta_key = %s 
                                        AND p.post_type = %s 
                                        AND p.post_status = 'publish'
                                        AND pm.meta_value != ''
                                        ORDER BY meta_value ASC",
                                        $field['name'],
                                        $post_type
                                    )
                                );
                                if ( !empty( $post_values ) ) {
                                    $meta_values = $post_values;
                                    break 2;
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Filter out empty values and return unique values
        $values = array_filter( array_map( 'trim', $meta_values ) );
        $values = array_unique( $values );
        
        return $values;
    }

}
