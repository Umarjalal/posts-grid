jQuery(document).ready(function($) {
    let loading = false;
    let currentPage = 1;
    let maxPages = 1;
    let infiniteScrollObserver = null;
    let pendingFilters = {};
    let appliedFilters = {};

    let currentRequest = null;
    let postsCache = new Map(); // Use Map for better performance
    let searchTimeout = null;

    // Optimized cache key generation
    function getCacheKey(settings, filters, paged) {
        return `${settings.post_type}-${settings.posts_per_page}-${paged}-${JSON.stringify(filters)}`;
    }

    // Optimized skeleton generation with template literals
    function generateSkeletonCards(count, settings) {
        if (settings.show_skeleton !== 'yes') return '';
        
        const layoutClass = settings.skeleton_layout || 'image-top';
        const skeletonImage = settings.skeleton_image === 'yes' ? '<div class="gpw-skeleton-image"></div>' : '';
        const skeletonContent = generateSkeletonContent(settings);
        
        return Array.from({length: count}, () => 
            `<div class="gpw-skeleton-card gpw-skeleton-${layoutClass}">
                ${skeletonImage}
                <div class="gpw-skeleton-content">${skeletonContent}</div>
            </div>`
        ).join('');
    }

    function generateSkeletonContent(settings) {
        const contentOrder = settings.skeleton_content_order?.length > 0 
            ? settings.skeleton_content_order 
            : [{element: 'title'}, {element: 'excerpt'}, {element: 'meta'}];
        
        return contentOrder.map(item => {
            switch(item.element) {
                case 'title':
                    return settings.skeleton_title === 'yes' ? '<div class="gpw-skeleton-title"></div>' : '';
                case 'excerpt':
                    return settings.skeleton_excerpt === 'yes' 
                        ? `<div class="gpw-skeleton-excerpt">${generateSkeletonLines(settings.skeleton_lines || 3)}</div>` 
                        : '';
                case 'meta':
                    return settings.skeleton_meta === 'yes' 
                        ? '<div class="gpw-skeleton-meta"><div class="gpw-skeleton-date"></div><div class="gpw-skeleton-category"></div></div>' 
                        : '';
                default:
                    return '';
            }
        }).join('');
    }

    function generateSkeletonLines(count) {
        return Array.from({length: count}, () => '<div class="gpw-skeleton-line"></div>').join('');
    }

    // Optimized loadPosts function with better error handling
    function loadPosts($wrapper, paged = 1, append = false) {
        if (loading && !append) return;
        loading = true;

        const settings = $wrapper.data('settings');
        const cacheKey = getCacheKey(settings, appliedFilters, paged);

        // Show skeleton immediately for better UX
        if (!append && settings.show_skeleton === 'yes') {
            const postsPerPage = settings.posts_per_page || 6;
            const skeletonHtml = generateSkeletonCards(postsPerPage, settings);
            $wrapper.find('.gpw-posts-grid').html(skeletonHtml);
        }

        // Return from cache if available
        if (postsCache.has(cacheKey)) {
            const cachedData = postsCache.get(cacheKey);
            updatePostsDisplay($wrapper, cachedData, append);
            loading = false;
            return;
        }

        // Cancel previous request
        if (currentRequest) {
            currentRequest.abort();
        }

        currentPage = paged;
        
        // Prepare AJAX data
        const ajaxData = {
            action: 'gpw_filter_posts',
            nonce: GPW_Ajax.nonce,
            post_type: settings.post_type,
            posts_per_page: settings.posts_per_page || 6,
            template_id: settings.template_id,
            empty_template_id: settings.empty_template_id || 0,
            paged: paged,
            search: appliedFilters.search || $wrapper.find('.gpw-search').val() || '',
            acf: appliedFilters.acf || {},
            tax: appliedFilters.tax || {},
            date_from: appliedFilters.dateFrom || '',
            date_to: appliedFilters.dateTo || '',
            search_in_title: settings.search_in_title || 'yes',
            search_in_content: settings.search_in_content || 'yes',
            search_in_acf: settings.search_in_acf || 'yes'
        };

        currentRequest = $.ajax({
            url: GPW_Ajax.ajax_url,
            type: 'POST',
            data: ajaxData,
            success: function(res) {
                if (res.success) {
                    // Cache the result
                    postsCache.set(cacheKey, res.data);
                    
                    // Limit cache size to prevent memory issues
                    if (postsCache.size > 50) {
                        const firstKey = postsCache.keys().next().value;
                        postsCache.delete(firstKey);
                    }
                    
                    updatePostsDisplay($wrapper, res.data, append);
                }
            },
            error: function(xhr, status) {
                if (status !== "abort" && !append) {
                    showErrorState($wrapper);
                }
            },
            complete: function() {
                currentRequest = null;
                loading = false;
                $wrapper.find('.gpw-loading').remove();
            }
        });
    }

    // Separate function for updating posts display
    function updatePostsDisplay($wrapper, data, append) {
        const $postsGrid = $wrapper.find('.gpw-posts-grid');
        
        if (append) {
            $postsGrid.append(data.html);
        } else {
            $postsGrid.html(data.html);
        }

        maxPages = data.max_pages;
        currentPage = data.current_page;

        const settings = $wrapper.data('settings');
        if (settings.show_pagination === 'yes') {
            updatePagination($wrapper, data);
        }
        updateResultsCount($wrapper, data.found_posts);
    }

    // Optimized error state display
    function showErrorState($wrapper) {
        $wrapper.find('.gpw-posts-grid').html(`
            <div class="gpw-error">
                <div class="gpw-error-icon">⚠️</div>
                <div class="gpw-error-title">Error Loading Posts</div>
                <div class="gpw-error-message">Please try again or refresh the page.</div>
                <button class="gpw-error-retry" onclick="location.reload()">Retry</button>
            </div>
        `);
    }

    // Optimized pagination generation
    function updatePagination($wrapper, data) {
        const settings = $wrapper.data('settings');
        const paginationType = settings.pagination_type || 'numbers';
        const $pagination = $wrapper.find('.gpw-pagination');
        
        if (data.max_pages <= 1) {
            $pagination.hide();
            return;
        }
        
        $pagination.show();
        let paginationHtml = '';
        
        switch (paginationType) {
            case 'numbers':
                paginationHtml = generateNumberedPagination(data.current_page, data.max_pages);
                break;
            case 'prev_next':
                paginationHtml = generatePrevNextPagination(data.current_page, data.max_pages);
                break;
            case 'load_more':
                if (data.current_page < data.max_pages) {
                    paginationHtml = `<button class="gpw-load-more">${settings.load_more_text || 'Load More Posts'}</button>`;
                }
                break;
        }
        
        $pagination.html(paginationHtml);
    }
    
    function generateNumberedPagination(currentPage, maxPages) {
        const prevButton = currentPage > 1 
            ? `<button class="gpw-page gpw-prev" data-page="${currentPage - 1}">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25" fill="none">
                    <path d="M18 13L6 13M6 13C7 13 9.5 14.5 9.5 16.5M6 13C7 13 9.5 11.5 9.5 9.5" stroke="#7A8487" stroke-width="1.5"/>
                </svg>
               </button>` 
            : '';

        const nextButton = currentPage < maxPages 
            ? `<button class="gpw-page gpw-next" data-page="${currentPage + 1}">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8" fill="none">
                    <path d="M0 4L12 4M12 4C11 4 8.5 2.5 8.5 0.5M12 4C11 4 8.5 5.5 8.5 7.5" stroke="white" stroke-width="1.5"/>
                </svg>
               </button>` 
            : '';
        
        // Generate page numbers
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(maxPages, currentPage + 2);
        
        let pageNumbers = '';
        
        if (startPage > 1) {
            pageNumbers += '<button class="gpw-page" data-page="1">1</button>';
            if (startPage > 2) {
                pageNumbers += '<span class="gpw-ellipsis">...</span>';
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === currentPage ? ' gpw-active' : '';
            pageNumbers += `<button class="gpw-page${activeClass}" data-page="${i}">${i}</button>`;
        }
        
        if (endPage < maxPages) {
            if (endPage < maxPages - 1) {
                pageNumbers += '<span class="gpw-ellipsis">...</span>';
            }
            pageNumbers += `<button class="gpw-page" data-page="${maxPages}">${maxPages}</button>`;
        }
        
        return prevButton + pageNumbers + nextButton;
    }
    
    function generatePrevNextPagination(currentPage, maxPages) {
        const prevButton = currentPage > 1 
            ? `<button class="gpw-page gpw-prev" data-page="${currentPage - 1}">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25" fill="none">
                    <path d="M18 13L6 13M6 13C7 13 9.5 14.5 9.5 16.5M6 13C7 13 9.5 11.5 9.5 9.5" stroke="#7A8487" stroke-width="1.5"/>
                </svg>
               </button>` 
            : '';

        const nextButton = currentPage < maxPages 
            ? `<button class="gpw-page gpw-next" data-page="${currentPage + 1}">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8" fill="none">
                    <path d="M0 4L12 4M12 4C11 4 8.5 2.5 8.5 0.5M12 4C11 4 8.5 5.5 8.5 7.5" stroke="white" stroke-width="1.5"/>
                </svg>
               </button>` 
            : '';
        
        return prevButton + `<span class="gpw-page-info">Page ${currentPage} of ${maxPages}</span>` + nextButton;
    }
    
    function updateResultsCount($wrapper, foundPosts) {
        let $resultsCount = $wrapper.find('.gpw-results-count');
        if ($resultsCount.length === 0) {
            $resultsCount = $('<div class="gpw-results-count" style="display:none;"></div>');
            $wrapper.find('.gpw-posts-grid').before($resultsCount);
        }
        
        $resultsCount.html(foundPosts > 0 ? `Found ${foundPosts} post${foundPosts !== 1 ? 's' : ''}` : '');
    }
    
    // Optimized infinite scroll setup
    function setupInfiniteScroll($wrapper) {
        const settings = $wrapper.data('settings');
        
        if (settings.show_pagination === 'yes' && settings.pagination_type === 'infinite') {
            if (infiniteScrollObserver) {
                infiniteScrollObserver.disconnect();
            }
            
            infiniteScrollObserver = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting && currentPage < maxPages && !loading) {
                        loadPosts($wrapper, currentPage + 1, true);
                    }
                });
            }, {
                rootMargin: '100px'
            });
            
            const $lastPost = $wrapper.find('.gpw-post').last();
            if ($lastPost.length > 0) {
                infiniteScrollObserver.observe($lastPost[0]);
            }
        }
    }
    
    // Optimized filter collection
    function collectPendingFilters($wrapper) {
        const filters = {
            acf: {},
            tax: {},
            dateFrom: '',
            dateTo: ''
        };
        
        // Collect ACF filters
        $wrapper.find('.gpw-acf-filter').each(function() {
            const $field = $(this);
            const fieldName = $field.data('field');
            const fieldType = $field.attr('type') || ($field.is('select') ? 'select' : 'text');
            const value = $field.val();
            
            if (fieldType === 'checkbox') {
                if ($field.is(':checked')) {
                    if (!filters.acf[fieldName]) {
                        filters.acf[fieldName] = [];
                    }
                    filters.acf[fieldName].push(value);
                }
            } else if (fieldType === 'radio') {
                if ($field.is(':checked')) {
                    filters.acf[fieldName] = value;
                }
            } else if (fieldType === 'select') {
                if (value && value !== '') {
                    filters.acf[fieldName] = value;
                }
            } else {
                if (value && value.trim() !== '') {
                    filters.acf[fieldName] = value;
                }
            }
        });
        
        // Collect taxonomy filters
        $wrapper.find('.gpw-tax-filter').each(function() {
            const $field = $(this);
            const taxonomy = $field.data('taxonomy');
            const fieldType = $field.attr('type') || 'select';
            const value = $field.val();
            
            if (fieldType === 'checkbox') {
                if ($field.is(':checked')) {
                    if (!filters.tax[taxonomy]) {
                        filters.tax[taxonomy] = [];
                    }
                    if (filters.tax[taxonomy].indexOf(value) === -1) {
                        filters.tax[taxonomy].push(value);
                    }
                }
            } else {
                if (value && value !== '' && value !== 'all') {
                    if (!filters.tax[taxonomy]) {
                        filters.tax[taxonomy] = [];
                    }
                    filters.tax[taxonomy].push(value);
                }
            }
        });
        
        filters.dateFrom = $wrapper.find('.gpw-date-filter-from').val();
        filters.dateTo = $wrapper.find('.gpw-date-filter-to').val();
        
        return filters;
    }
    
    // Optimized accordion count update
    function updateAccordionCounts($wrapper) {
        $wrapper.find('.gpw-accordion-count[data-field]').each(function() {
            const fieldName = $(this).data('field');
            const $countElement = $(this);
            
            let totalOptions = $wrapper.find(`.gpw-acf-filter[data-field="${fieldName}"]`).length;
            
            if (totalOptions === 0) {
                totalOptions = $wrapper.find(`.gpw-tax-filter[data-taxonomy="${fieldName}"]`).length;
            }
            
            $countElement.text(totalOptions);
        });
    }
    
    // Optimized selected filters display
    function updateSelectedFiltersDisplay($wrapper) {
        const filters = collectPendingFilters($wrapper);
        const $selectedFilters = $wrapper.find('.gpw-selected-filters');
        const $selectedTags = $wrapper.find('.gpw-selected-filters-tags');
        const $selectedCount = $wrapper.find('.gpw-selected-count');
        const $filterActions = $wrapper.find('.gpw-filter-actions');
        const $filtersIndicator = $wrapper.find('.gpw-filters-indicator');
        
        const selectedItems = [];
        let totalCount = 0;
        
        // Process ACF filters
        Object.entries(filters.acf).forEach(([fieldName, value]) => {
            if (Array.isArray(value)) {
                value.forEach(v => {
                    selectedItems.push({
                        type: 'acf',
                        field: fieldName,
                        value: v,
                        label: v
                    });
                    totalCount++;
                });
            } else if (value) {
                selectedItems.push({
                    type: 'acf',
                    field: fieldName,
                    value: value,
                    label: value
                });
                totalCount++;
            }
        });
        
        // Process taxonomy filters
        Object.entries(filters.tax).forEach(([taxonomy, terms]) => {
            if (Array.isArray(terms)) {
                terms.forEach(term => {
                    selectedItems.push({
                        type: 'tax',
                        taxonomy: taxonomy,
                        value: term,
                        label: term
                    });
                    totalCount++;
                });
            } else if (terms) {
                selectedItems.push({
                    type: 'tax',
                    taxonomy: taxonomy,
                    value: terms,
                    label: terms
                });
                totalCount++;
            }
        });
        
        // Process date filters
        if (filters.dateFrom || filters.dateTo) {
            let dateLabel = '';
            if (filters.dateFrom && filters.dateTo) {
                dateLabel = `${filters.dateFrom} - ${filters.dateTo}`;
            } else if (filters.dateFrom) {
                dateLabel = `From ${filters.dateFrom}`;
            } else if (filters.dateTo) {
                dateLabel = `To ${filters.dateTo}`;
            }
            
            selectedItems.push({
                type: 'date',
                from: filters.dateFrom,
                to: filters.dateTo,
                label: dateLabel
            });
            totalCount++;
        }
        
        $selectedCount.text(totalCount);
        
        // Generate tags HTML
        const tagsHtml = selectedItems.map(item => {
            const dataAttrs = [
                `data-type="${item.type}"`,
                item.field ? `data-field="${item.field}"` : '',
                item.taxonomy ? `data-taxonomy="${item.taxonomy}"` : '',
                item.value ? `data-value="${item.value}"` : ''
            ].filter(Boolean).join(' ');
            
            return `<span class="gpw-selected-tag" ${dataAttrs}>
                <span class="gpw-tag">
                    <span class="gpw-remove-tag">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M8.375 8.375L1.625 1.625M1.625 8.375L8.375 1.625" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </span> ${item.label}
                </span>
            </span>`;
        }).join('');
        
        $selectedTags.html(tagsHtml);
        
        // Show/hide elements based on filter count
        $selectedFilters.toggle(totalCount > 0);
        $filterActions.toggle(totalCount > 0);
        
        updateAccordionCounts($wrapper);
    }
    
    function isEmptyFilters(filters) {
        return Object.keys(filters.acf).length === 0 &&
               Object.keys(filters.tax).length === 0 &&
               !filters.dateFrom &&
               !filters.dateTo;
    }
    
    // Optimized filter removal
    function removeSelectedFilter($wrapper, $tag) {
        const type = $tag.data('type');
        const field = $tag.data('field');
        const taxonomy = $tag.data('taxonomy');
        const value = $tag.data('value');
        
        if (type === 'acf' && field) {
            const $fields = $wrapper.find(`.gpw-acf-filter[data-field="${field}"]`);
            if ($fields.length > 0) {
                const fieldType = $fields.first().attr('type') || ($fields.first().is('select') ? 'select' : 'text');
                if (fieldType === 'checkbox' || fieldType === 'radio') {
                    $fields.filter(`[value="${value}"]`).prop('checked', false).trigger('change');
                } else {
                    $fields.val('').trigger('change');
                }
            }
        } else if (type === 'tax' && taxonomy) {
            const $fields = $wrapper.find(`.gpw-tax-filter[data-taxonomy="${taxonomy}"]`);
            if ($fields.length > 0) {
                const fieldType = $fields.first().attr('type') || ($fields.first().is('select') ? 'select' : 'text');
                if (fieldType === 'checkbox' || fieldType === 'radio') {
                    $fields.filter(`[value="${value}"]`).prop('checked', false).trigger('change');
                } else {
                    $fields.val('').trigger('change');
                }
            }
        } else if (type === 'date') {
            $wrapper.find('.gpw-date-filter-from, .gpw-date-filter-to').val('').trigger('change');
        }
        
        updateSelectedFiltersDisplay($wrapper);
    }
    
    // Optimized filter application
    function applyFilters($wrapper) {
        pendingFilters = collectPendingFilters($wrapper);
        appliedFilters = JSON.parse(JSON.stringify(pendingFilters));

        const $sidebar = $wrapper.find('.gpw-filters-wrapper');
        const $showFiltersWrapper = $wrapper.find('.gpw-show-filters-wrapper');
        const $filtersIndicator = $wrapper.find('.gpw-filters-indicator');

        $sidebar.removeClass('active');
        $showFiltersWrapper.fadeIn(300);

        // Show indicator when filters are applied
        const hasFilters = Object.keys(appliedFilters.acf).length > 0 || 
                          Object.keys(appliedFilters.tax).length > 0 || 
                          appliedFilters.dateFrom || 
                          appliedFilters.dateTo || 
                          appliedFilters.search;
        
        $filtersIndicator.toggle(hasFilters);
        loadPosts($wrapper, 1);
    }

    // Optimized filter reset
    function resetFilters($wrapper) {
        // Clear all form elements
        $wrapper.find('.gpw-acf-filter, .gpw-tax-filter, .gpw-date-filter-from, .gpw-date-filter-to')
                .val('')
                .prop('checked', false)
                .prop('selectedIndex', 0);
        
        // Clear applied filters
        appliedFilters = {};
        pendingFilters = {};
        
        // Close sidebar and hide indicator
        const $sidebar = $wrapper.find('.gpw-filters-wrapper');
        const $showFiltersWrapper = $wrapper.find('.gpw-show-filters-wrapper');
        const $filtersIndicator = $wrapper.find('.gpw-filters-indicator');
        
        $sidebar.removeClass('active');
        $showFiltersWrapper.fadeIn(300);
        $filtersIndicator.fadeOut(300);
        
        updateSelectedFiltersDisplay($wrapper);
        loadPosts($wrapper, 1);
    }
    
    // Optimized accordion setup
    function setupAccordionToggle($wrapper) {
        $wrapper.on('click', '.gpw-accordion-header', function() {
            const $header = $(this);
            const $content = $header.next('.gpw-accordion-content');
            const $toggle = $header.find('.gpw-accordion-toggle');
            
            if ($content.is(':visible')) {
                $content.slideUp(300);
                $toggle.css({ transform: 'rotate(0deg)', transition: 'transform 0.3s' });
            } else {
                $content.slideDown(300);
                $toggle.css({ transform: 'rotate(180deg)', transition: 'transform 0.3s' });
            }
        });
    }
    
    // Optimized sidebar toggle
    function setupFilterSidebarToggle($wrapper) {
        $wrapper.on('click', '.gpw-filter-toggle-btn', function() {
            const $sidebar = $wrapper.find('.gpw-filters-wrapper');
            const $showFiltersWrapper = $wrapper.find('.gpw-show-filters-wrapper');
            
            $sidebar.removeClass('active');
            $showFiltersWrapper.fadeIn(300);
        });
        
        $wrapper.on('click', '.gpw-show-filters-btn', function() {
            const $sidebar = $wrapper.find('.gpw-filters-wrapper');
            const $showFiltersWrapper = $wrapper.find('.gpw-show-filters-wrapper');
            
            $sidebar.addClass('active');
            $showFiltersWrapper.fadeOut(300);
        });
    }
    
    // Optimized debounce function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Cleanup function
    function cleanupObservers($wrapper) {
        const observer = $wrapper.data('mutationObserver');
        if (observer) {
            observer.disconnect();
            $wrapper.removeData('mutationObserver');
        }
        
        if (infiniteScrollObserver) {
            infiniteScrollObserver.disconnect();
            infiniteScrollObserver = null;
        }
    }
    
    // Initialize widgets with optimized event handling
    $('.gpw-wrapper').each(function() {
        const $wrapper = $(this);
        const settings = $wrapper.data('settings');
        
        // Initialize filters
        pendingFilters = {};
        appliedFilters = {};
        
        // Initial load
        loadPosts($wrapper, 1);
        
        // Hide elements initially
        $wrapper.find('.gpw-filter-actions, .gpw-filters-indicator').hide();
        
        updateAccordionCounts($wrapper);
        
        // Optimized search handler
        if (settings.show_search === 'yes') {
            const debouncedSearch = debounce(function() {
                const searchTerm = $wrapper.find('.gpw-search').val();
                appliedFilters.search = searchTerm;
                loadPosts($wrapper, 1);
            }, 300); // Reduced debounce time for better responsiveness
            
            $wrapper.on('keyup', '.gpw-search', debouncedSearch);
            
            $wrapper.on('input', '.gpw-search', function() {
                const searchTerm = $(this).val();
                const $clearBtn = $wrapper.find('.gpw-search-clear');
                $clearBtn.toggle(searchTerm.length > 0);
            });
            
            $wrapper.on('click', '.gpw-search-clear', function() {
                $wrapper.find('.gpw-search').val('');
                appliedFilters.search = '';
                loadPosts($wrapper, 1);
                $(this).hide();
            });
        }
        
        // Filter change handlers
        $wrapper.on('change', '.gpw-acf-filter, .gpw-tax-filter, .gpw-date-filter-from, .gpw-date-filter-to', function() {
            updateSelectedFiltersDisplay($wrapper);
            const pending = collectPendingFilters($wrapper);
            if (isEmptyFilters(pending)) {
                applyFilters($wrapper);
            }
        });
        
        // Event delegation for better performance
        $wrapper.on('click', '.gpw-remove-tag', function(e) {
            e.preventDefault();
            removeSelectedFilter($wrapper, $(this).closest('.gpw-selected-tag'));
        });
        
        $wrapper.on('click', '.gpw-confirm-filters', function(e) {
            e.preventDefault();
            applyFilters($wrapper);
        });
        
        $wrapper.on('click', '.gpw-reset-filters', function(e) {
            e.preventDefault();
            resetFilters($wrapper);
        });
        
        $wrapper.on('click', '.gpw-page', function(e) {
            e.preventDefault();
            const page = $(this).data('page');
            if (page && page !== currentPage) {
                loadPosts($wrapper, page);
            }
        });
        
        $wrapper.on('click', '.gpw-load-more', function(e) {
            e.preventDefault();
            if (currentPage < maxPages && !loading) {
                loadPosts($wrapper, currentPage + 1, true);
            }
        });
        
        // Setup features
        if (settings.show_pagination === 'yes' && settings.pagination_type === 'infinite') {
            setupInfiniteScroll($wrapper);
        }
        
        if (settings.filters_layout === 'accordion') {
            setupAccordionToggle($wrapper);
        }
        
        setupFilterSidebarToggle($wrapper);
    });
    
    // Cleanup on page unload
    $(window).on('beforeunload', function() {
        $('.gpw-wrapper').each(function() {
            cleanupObservers($(this));
        });
    });
});

// Optimized Dark/Light Mode Toggle
document.addEventListener("DOMContentLoaded", () => {
    const DARK_COLOR = "#001319";
    const WHITE_COLOR = "#ffffff";
    const THEME_KEY = "gpw_theme";
    
    const lightBtn = document.getElementById("lightToggle");
    const darkBtn = document.getElementById("darkToggle");
    
    // Cache DOM elements that need theme switching
    let themeElements = null;
    
    function cacheThemeElements() {
        if (!themeElements) {
            themeElements = document.querySelectorAll(
                "*:not(footer):not(footer *):not(.no-theme-switch):not(.no-theme-switch *)"
            );
        }
        return themeElements;
    }
    
    // Optimized color conversion
    function rgbToHex(rgb) {
        if (rgb === `rgb(0, 19, 25)`) return DARK_COLOR;
        if (rgb === `rgb(255, 255, 255)`) return WHITE_COLOR;
        return rgb;
    }
    
    function shouldSwapColor(color, isDarkMode) {
        const hex = rgbToHex(color);
        return (isDarkMode && hex === WHITE_COLOR) || (!isDarkMode && hex === DARK_COLOR);
    }
    
    // Optimized theme application
    function applyTheme(isDarkMode) {
        const elements = cacheThemeElements();
        const fromColor = isDarkMode ? WHITE_COLOR : DARK_COLOR;
        const toColor = isDarkMode ? DARK_COLOR : WHITE_COLOR;
        
        // Use requestAnimationFrame for better performance
        requestAnimationFrame(() => {
            elements.forEach(el => {
                const style = getComputedStyle(el);
                let changed = false;
                
                // Background color
                if (rgbToHex(style.backgroundColor) === fromColor) {
                    el.style.backgroundColor = toColor;
                    el.dataset.prevBg = fromColor;
                    changed = true;
                }
                
                // Text color
                if (rgbToHex(style.color) === fromColor) {
                    el.style.color = toColor;
                    el.dataset.prevColor = fromColor;
                    changed = true;
                }
                
                // Border colors
                ["Top", "Right", "Bottom", "Left"].forEach(side => {
                    const borderColor = style[`border${side}Color`];
                    if (rgbToHex(borderColor) === fromColor) {
                        el.style[`border${side}Color`] = toColor;
                        el.dataset[`prevBorder${side}`] = fromColor;
                        changed = true;
                    }
                });
                
                // SVG elements
                if (["svg", "path", "circle", "rect", "g"].includes(el.tagName.toLowerCase())) {
                    if (rgbToHex(style.fill) === fromColor) {
                        el.style.fill = toColor;
                        el.dataset.prevFill = fromColor;
                        changed = true;
                    }
                    
                    if (rgbToHex(style.stroke) === fromColor) {
                        el.style.stroke = toColor;
                        el.dataset.prevStroke = fromColor;
                        changed = true;
                    }
                }
                
                if (changed) {
                    el.dataset.themeModified = isDarkMode ? "dark" : "light";
                }
            });
        });
    }
    
    // Optimized theme restoration
    function restoreTheme() {
        const modifiedElements = document.querySelectorAll("[data-theme-modified]");
        
        requestAnimationFrame(() => {
            modifiedElements.forEach(el => {
                // Restore all modified properties
                ["prevBg", "prevColor", "prevFill", "prevStroke"].forEach(prop => {
                    if (el.dataset[prop]) {
                        const styleProp = prop.replace("prev", "").toLowerCase();
                        const actualProp = styleProp === "bg" ? "backgroundColor" : styleProp;
                        el.style[actualProp] = el.dataset[prop];
                        delete el.dataset[prop];
                    }
                });
                
                // Restore border colors
                ["Top", "Right", "Bottom", "Left"].forEach(side => {
                    const key = `prevBorder${side}`;
                    if (el.dataset[key]) {
                        el.style[`border${side}Color`] = el.dataset[key];
                        delete el.dataset[key];
                    }
                });
                
                delete el.dataset.themeModified;
            });
        });
    }
    
    function activateLightMode() {
        if (!lightBtn || lightBtn.classList.contains("active")) return;
        
        document.body.className = document.body.className.replace(/\b(dark|light)-theme\b/g, '') + ' light-theme';
        
        lightBtn.classList.add("active");
        lightBtn.classList.remove("inactive");
        
        if (darkBtn) {
            darkBtn.classList.remove("active");
            darkBtn.classList.add("inactive");
        }
        
        applyTheme(false);
        localStorage.setItem(THEME_KEY, "light");
    }
    
    function activateDarkMode() {
        if (!darkBtn || darkBtn.classList.contains("active")) return;
        
        document.body.className = document.body.className.replace(/\b(dark|light)-theme\b/g, '') + ' dark-theme';
        
        darkBtn.classList.add("active");
        darkBtn.classList.remove("inactive");
        
        if (lightBtn) {
            lightBtn.classList.remove("active");
            lightBtn.classList.add("inactive");
        }
        
        restoreTheme();
        localStorage.setItem(THEME_KEY, "dark");
    }
    
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === "light") {
        activateLightMode();
    } else if (savedTheme === "dark") {
        activateDarkMode();
    } else {
        // Default to dark mode
        activateDarkMode();
    }
    
    // Event listeners
    if (lightBtn) lightBtn.addEventListener("click", activateLightMode);
    if (darkBtn) darkBtn.addEventListener("click", activateDarkMode);
    
    // Invalidate cache when DOM changes significantly
    const observer = new MutationObserver(() => {
        themeElements = null;
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});