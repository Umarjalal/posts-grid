jQuery(document).ready(function($) {
    let loading = false;
    let currentPage = 1;
    let maxPages = 1;
    let infiniteScrollObserver = null;
    let pendingFilters = {};
    let appliedFilters = {};

let currentRequest = null;
let postsCache = {};

function getCacheKey(settings, filters, paged) {
    return JSON.stringify({settings, filters, paged});
}

function loadPosts($wrapper, paged = 1, append = false) {
    let settings = $wrapper.data('settings');

    // --- 0. Show skeleton immediately (before anything else) ---
    if (!append && settings.show_skeleton === 'yes') {
        let postsPerPage = settings.posts_per_page || 6;
        let skeletonHtml = generateSkeletonCards(postsPerPage, settings);
        $wrapper.find('.gpw-posts-grid').html(skeletonHtml);
    }

    // Build cache key
    let cacheKey = getCacheKey(settings, appliedFilters, paged);

    // --- 1. Return from cache if available ---
    if (postsCache[cacheKey]) {
        if (append) {
            $wrapper.find('.gpw-posts-grid').append(postsCache[cacheKey].html);
        } else {
            $wrapper.find('.gpw-posts-grid').html(postsCache[cacheKey].html);
        }
        maxPages = postsCache[cacheKey].max_pages;
        currentPage = postsCache[cacheKey].current_page;

        if (settings.show_pagination === 'yes') {
            updatePagination($wrapper, postsCache[cacheKey]);
        }
        updateResultsCount($wrapper, postsCache[cacheKey].found_posts);
        return;
    }

    // --- 2. Cancel old request if still running ---
    if (currentRequest) {
        currentRequest.abort();
    }

    // --- 3. Fire new AJAX request ---
    currentPage = paged;
    currentRequest = $.ajax({
        url: GPW_Ajax.ajax_url,
        type: 'POST',
        data: {
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
        },
        success: function(res) {
            if (res.success) {
                // --- 4. Save in cache ---
                postsCache[cacheKey] = res.data;

                // --- 5. Replace skeleton with posts ---
                if (append) {
                    $wrapper.find('.gpw-posts-grid').append(res.data.html);
                } else {
                    $wrapper.find('.gpw-posts-grid').html(res.data.html);
                }

                maxPages = res.data.max_pages;
                currentPage = res.data.current_page;

                if (settings.show_pagination === 'yes') {
                    updatePagination($wrapper, res.data);
                }
                updateResultsCount($wrapper, res.data.found_posts);
            }
        },
        error: function(xhr, status) {
            if (status !== "abort" && !append) {
                $wrapper.find('.gpw-posts-grid').html(`
                    <div class="gpw-error">
                        <div class="gpw-error-icon">⚠️</div>
                        <div class="gpw-error-title">Error Loading Posts</div>
                        <div class="gpw-error-message">Please try again or refresh the page.</div>
                        <button class="gpw-error-retry" onclick="location.reload()">Retry</button>
                    </div>
                `);
            }
        },
        complete: function() {
            currentRequest = null;
            $wrapper.find('.gpw-loading').remove();
        }
    });
}



    function updatePagination($wrapper, data) {
        let settings = $wrapper.data('settings');
        let paginationType = settings.pagination_type || 'numbers';
        let $pagination = $wrapper.find('.gpw-pagination');
        
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
                    paginationHtml = '<button class="gpw-load-more">' + (settings.load_more_text || 'Load More Posts') + '</button>';
                }
                break;
            case 'infinite':
                // Infinite scroll is handled separately
                break;
        }
        
        $pagination.html(paginationHtml);
    }
    
    function generateNumberedPagination(currentPage, maxPages) {
        let html = '';
        
        // Previous button
        if (currentPage > 1) {
            html += '<button class="gpw-page gpw-prev" data-page="' + (currentPage - 1) + '">' +
            '  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25" fill="none">' +
            '<path d="M18 13L6 13M6 13C7 13 9.5 14.5 9.5 16.5M6 13C7 13 9.5 11.5 9.5 9.5" stroke="#7A8487" stroke-width="1.5"/>' +
            '</svg>' +
            '</button>';
        }
    
        
        // Page numbers
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(maxPages, currentPage + 2);
        
        if (startPage > 1) {
            html += '<button class="gpw-page" data-page="1">1</button>';
            if (startPage > 2) {
                html += '<span class="gpw-ellipsis">...</span>';
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            let activeClass = i === currentPage ? ' gpw-active' : '';
            html += '<button class="gpw-page' + activeClass + '" data-page="' + i + '">' + i + '</button>';
        }
        
        if (endPage < maxPages) {
            if (endPage < maxPages - 1) {
                html += '<span class="gpw-ellipsis">...</span>';
            }
            html += '<button class="gpw-page" data-page="' + maxPages + '">' + maxPages + '</button>';
        }
        
        // Next button
        if (currentPage < maxPages) {
            html += '<button class="gpw-page gpw-next" data-page="' + (currentPage + 1) + '">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8" fill="none">' +
            '<path d="M0 4L12 4M12 4C11 4 8.5 2.5 8.5 0.5M12 4C11 4 8.5 5.5 8.5 7.5" stroke="white" stroke-width="1.5"/>' +
            '</svg>' +
            '</button>';
        }
        
        return html;
    }
    
    function generatePrevNextPagination(currentPage, maxPages) {
        let html = '';
        
        if (currentPage > 1) {
            html += '<button class="gpw-page gpw-prev" data-page="' + (currentPage - 1) + '">' +
            '  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25" fill="none">' +
            '<path d="M18 13L6 13M6 13C7 13 9.5 14.5 9.5 16.5M6 13C7 13 9.5 11.5 9.5 9.5" stroke="#7A8487" stroke-width="1.5"/>' +
            '</svg>' +
            '</button>';
        }
        
        html += '<span class="gpw-page-info">Page ' + currentPage + ' of ' + maxPages + '</span>';
        
        if (currentPage < maxPages) {
            html += '<button class="gpw-page gpw-next" data-page="' + (currentPage + 1) + '">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8" fill="none">' +
            '<path d="M0 4L12 4M12 4C11 4 8.5 2.5 8.5 0.5M12 4C11 4 8.5 5.5 8.5 7.5" stroke="white" stroke-width="1.5"/>' +
            '</svg>' +
            '</button>';
        }
        
        
        return html;
    }
    
    function updateResultsCount($wrapper, foundPosts) {
        let $resultsCount = $wrapper.find('.gpw-results-count');
        if ($resultsCount.length === 0) {
            $resultsCount = $('<div class="gpw-results-count" style="display:none;"></div>');
            $wrapper.find('.gpw-posts-grid').before($resultsCount);
        }
        
        if (foundPosts > 0) {
            $resultsCount.html('Found ' + foundPosts + ' post' + (foundPosts !== 1 ? 's' : ''));
        } else {
            $resultsCount.html('');
        }
    }
    
    function setupInfiniteScroll($wrapper) {
        let settings = $wrapper.data('settings');
        
        if (settings.show_pagination === 'yes' && settings.pagination_type === 'infinite') {
            // Remove existing observer
            if (infiniteScrollObserver) {
                infiniteScrollObserver.disconnect();
            }
            
            // Create new observer
            infiniteScrollObserver = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting && currentPage < maxPages && !loading) {
                        loadPosts($wrapper, currentPage + 1, true);
                    }
                });
            }, {
                rootMargin: '100px'
            });
            
            // Observe the last post
            let $lastPost = $wrapper.find('.gpw-post').last();
            if ($lastPost.length > 0) {
                infiniteScrollObserver.observe($lastPost[0]);
            }
        }
    }
    
    // Cleanup function for observers
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
    
    // Setup accordion toggle functionality
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
    
    // Setup filter sidebar toggle functionality
    function setupFilterSidebarToggle($wrapper) {
        // Hide filters button (inside sidebar)
        $wrapper.on('click', '.gpw-filter-toggle-btn', function() {
            const $sidebar = $wrapper.find('.gpw-filters-wrapper');
            const $showFiltersWrapper = $wrapper.find('.gpw-show-filters-wrapper');
            
            // Hide sidebar
            $sidebar.removeClass('active');
            // Show the "Show Filters" button
            $showFiltersWrapper.fadeIn(300);
        });
        
        // Show filters button (outside sidebar)
        $wrapper.on('click', '.gpw-show-filters-btn', function() {
            const $sidebar = $wrapper.find('.gpw-filters-wrapper');
            const $showFiltersWrapper = $wrapper.find('.gpw-show-filters-wrapper');
            
            // Show sidebar
            $sidebar.addClass('active');
            // Hide the "Show Filters" button
            $showFiltersWrapper.fadeOut(300);
        });
    }
    
    // Collect pending filters from DOM
    function collectPendingFilters($wrapper) {
        let filters = {
            acf: {},
            tax: {},
            dateFrom: '',
            dateTo: ''
        };
        
        // Collect ACF filters
        $wrapper.find('.gpw-acf-filter').each(function() {
            let $field = $(this);
            let fieldName = $field.data('field');
            let fieldType = $field.attr('type') || ($field.is('select') ? 'select' : 'text');
            let value = $field.val();
            
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
                // Text, date, etc.
                if (value && value.trim() !== '') {
                    filters.acf[fieldName] = value;
                }
            }
        });
        
        // Collect taxonomy filters - FIXED VERSION
        $wrapper.find('.gpw-tax-filter').each(function() {
            let $field = $(this);
            let taxonomy = $field.data('taxonomy');
            let fieldType = $field.attr('type') || 'select';
            let value = $field.val();
            
            if (fieldType === 'checkbox') {
                if ($field.is(':checked')) {
                    if (!filters.tax[taxonomy]) {
                        filters.tax[taxonomy] = [];
                    }
                    // Only add if not already in array
                    if (filters.tax[taxonomy].indexOf(value) === -1) {
                        filters.tax[taxonomy].push(value);
                    }
                }
            } else {
                // Select, radio, etc.
                if (value && value !== '' && value !== 'all') {
                    if (!filters.tax[taxonomy]) {
                        filters.tax[taxonomy] = [];
                    }
                    filters.tax[taxonomy].push(value);
                }
            }
        });
    
        
        // Collect date filters
        filters.dateFrom = $wrapper.find('.gpw-date-filter-from').val();
        filters.dateTo = $wrapper.find('.gpw-date-filter-to').val();
        
        return filters;
    }
    
    // Update accordion count numbers
    function updateAccordionCounts($wrapper) {
        // Find all count elements
        let $countElements = $wrapper.find('.gpw-accordion-count[data-field]');
        
        // Update ACF field counts - show total available options
        $countElements.each(function() {
            let fieldName = $(this).data('field');
            let $countElement = $(this);
            
            // Count total available options for this field
            let $acfFilters = $wrapper.find('.gpw-acf-filter[data-field="' + fieldName + '"]');
            let totalOptions = $acfFilters.length;
            
            if (totalOptions === 0) {
                // If no ACF filters found, try taxonomy filters
                let $taxFilters = $wrapper.find('.gpw-tax-filter[data-taxonomy="' + fieldName + '"]');
                totalOptions = $taxFilters.length;
            }
            
            $countElement.text(totalOptions);
        });
    }
    
    // Update selected filters display
    function updateSelectedFiltersDisplay($wrapper) {
        let filters = collectPendingFilters($wrapper);
        let $selectedFilters = $wrapper.find('.gpw-selected-filters');
        let $selectedTags = $wrapper.find('.gpw-selected-filters-tags');
        let $selectedCount = $wrapper.find('.gpw-selected-count');
        let $filterActions = $wrapper.find('.gpw-filter-actions');
        let $filtersIndicator = $wrapper.find('.gpw-filters-indicator');
        
        let selectedItems = [];
        let totalCount = 0;
        
        // Count ACF filters
        Object.keys(filters.acf).forEach(fieldName => {
            if (Array.isArray(filters.acf[fieldName])) {
                filters.acf[fieldName].forEach(value => {
                    selectedItems.push({
                        type: 'acf',
                        field: fieldName,
                        value: value,
                        label: value
                    });
                    totalCount++;
                });
            } else if (filters.acf[fieldName]) {
                selectedItems.push({
                    type: 'acf',
                    field: fieldName,
                    value: filters.acf[fieldName],
                    label: filters.acf[fieldName]
                });
                totalCount++;
            }
        });
        
        // Count taxonomy filters - FIXED: Handle array of terms
        Object.keys(filters.tax).forEach(taxonomy => {
            if (Array.isArray(filters.tax[taxonomy])) {
                // Multiple terms selected for this taxonomy
                filters.tax[taxonomy].forEach(term => {
                    selectedItems.push({
                        type: 'tax',
                        taxonomy: taxonomy,
                        value: term,
                        label: term
                    });
                    totalCount++;
                });
            } else if (filters.tax[taxonomy]) {
                // Single term selected for this taxonomy
                selectedItems.push({
                    type: 'tax',
                    taxonomy: taxonomy,
                    value: filters.tax[taxonomy],
                    label: filters.tax[taxonomy]
                });
                totalCount++;
            }
        });
        
        // Count date filters
        if (filters.dateFrom || filters.dateTo) {
            let dateLabel = '';
            if (filters.dateFrom && filters.dateTo) {
                dateLabel = filters.dateFrom + ' - ' + filters.dateTo;
            } else if (filters.dateFrom) {
                dateLabel = 'From ' + filters.dateFrom;
            } else if (filters.dateTo) {
                dateLabel = 'To ' + filters.dateTo;
            }
            
            selectedItems.push({
                type: 'date',
                from: filters.dateFrom,
                to: filters.dateTo,
                label: dateLabel
            });
            totalCount++;
        }
        
        // Update count
        $selectedCount.text(totalCount);
        
        // Generate tags HTML
        let tagsHtml = '';
        selectedItems.forEach(item => {
            tagsHtml += '<span class="gpw-selected-tag" data-type="' + item.type + '"';
            if (item.field) tagsHtml += ' data-field="' + item.field + '"';
            if (item.taxonomy) tagsHtml += ' data-taxonomy="' + item.taxonomy + '"';
            if (item.value) tagsHtml += ' data-value="' + item.value + '"';
            tagsHtml += '>';
            tagsHtml += 
            '<span class="gpw-tag">' + 
                '<span class="gpw-remove-tag">' +
                '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none">' +
                    '<path d="M8.375 8.375L1.625 1.625M1.625 8.375L8.375 1.625" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
                '</svg>' +
                '</span> ' + 
                item.label + 
            '</span>';
            tagsHtml += '</span>';
        });

        
        $selectedTags.html(tagsHtml);
        
        // Show/hide selected filters section
        if (totalCount > 0) {
            $selectedFilters.show();
        } else {
            $selectedFilters.hide();
        }
        
        // Show/hide filter action buttons based on whether there are pending filters
        if (totalCount > 0) {
            $filterActions.fadeIn(300);

        } else {
            $filterActions.fadeOut(300);

        }
        
        // Update accordion count numbers
        updateAccordionCounts($wrapper);
    }
    
    function isEmptyFilters(filters) {
        return Object.keys(filters.acf).length === 0 &&
               Object.keys(filters.tax).length === 0 &&
               (filters.dateFrom || '') === '' &&
               (filters.dateTo || '') === '';
    }
    
    // Remove selected filter tag
    function removeSelectedFilter($wrapper, $tag) {
        let type = $tag.data('type');
        let field = $tag.data('field');
        let taxonomy = $tag.data('taxonomy');
        let value = $tag.data('value');
        
        if (type === 'acf' && field) {
            let $fields = $wrapper.find('.gpw-acf-filter[data-field="' + field + '"]');
            if ($fields.length > 0) {
                let fieldType = $fields.first().attr('type') || ($fields.first().is('select') ? 'select' : 'text');
                if (fieldType === 'checkbox' || fieldType === 'radio') {
                    $fields.each(function() {
                        let $field = $(this);
                        if ($field.val() === value) {
                            $field.prop('checked', false).trigger('change');
                        }
                    });
                } else if (fieldType === 'select') {
                    $fields.val('').trigger('change');
                } else {
                    $fields.val('').trigger('change');
                }
            }
        } else if (type === 'tax' && taxonomy) {
            let $fields = $wrapper.find('.gpw-tax-filter[data-taxonomy="' + taxonomy + '"]');
            if ($fields.length > 0) {
                let fieldType = $fields.first().attr('type') || ($fields.first().is('select') ? 'select' : 'text');
                if (fieldType === 'checkbox' || fieldType === 'radio') {
                    $fields.each(function() {
                        let $field = $(this);
                        if ($field.val() === value) {
                            $field.prop('checked', false).trigger('change');
                        }
                    });
                } else if (fieldType === 'select') {
                    $fields.val('').trigger('change');
                } else {
                    $fields.val('').trigger('change');
                }
            }
        } else if (type === 'date') {
            $wrapper.find('.gpw-date-filter-from').val('').trigger('change');
            $wrapper.find('.gpw-date-filter-to').val('').trigger('change');
        }
        
        updateSelectedFiltersDisplay($wrapper);
    }
    
    // Apply filters
    function applyFilters($wrapper) {
        pendingFilters = collectPendingFilters($wrapper);
        appliedFilters = JSON.parse(JSON.stringify(pendingFilters));

        const $sidebar = $wrapper.find('.gpw-filters-wrapper');
        const $showFiltersWrapper = $wrapper.find('.gpw-show-filters-wrapper');
        const $filtersIndicator = $wrapper.find('.gpw-filters-indicator');

        $sidebar.removeClass('active');
        $showFiltersWrapper.fadeIn(300);

        // ✅ Show indicator only when filters are applied
        if (Object.keys(appliedFilters.acf).length > 0 || 
            Object.keys(appliedFilters.tax).length > 0 || 
            appliedFilters.dateFrom || 
            appliedFilters.dateTo || 
            appliedFilters.search) {
            $filtersIndicator.fadeIn(300);
        } else {
            $filtersIndicator.fadeOut(300);
        }

        loadPosts($wrapper, 1);
    }

    
    // Reset all filters
    function resetFilters($wrapper) {
        // Uncheck all checkboxes
        $wrapper.find('.gpw-acf-filter[type="checkbox"]').prop('checked', false);
        $wrapper.find('.gpw-tax-filter[type="checkbox"]').prop('checked', false);
        
        // Uncheck radio buttons
        $wrapper.find('.gpw-acf-filter[type="radio"]').prop('checked', false);
        
        // Clear text inputs
        $wrapper.find('.gpw-acf-filter[type="text"]').val('');
        $wrapper.find('.gpw-acf-filter[type="date"]').val('');
        
        // Clear date inputs
        $wrapper.find('.gpw-date-filter-from').val('');
        $wrapper.find('.gpw-date-filter-to').val('');
        
        // Clear selects
        $wrapper.find('.gpw-acf-filter[type="select"]').prop('selectedIndex', 0);
        
        // Clear applied filters
        appliedFilters = {};
        pendingFilters = {};
        
        // Close the filters sidebar
        const $sidebar = $wrapper.find('.gpw-filters-wrapper');
        const $showFiltersWrapper = $wrapper.find('.gpw-show-filters-wrapper');
        
        $sidebar.removeClass('active');
        $showFiltersWrapper.fadeIn(300);
        const $filtersIndicator = $wrapper.find('.gpw-filters-indicator');
        $filtersIndicator.fadeOut(300); // ✅ Always hid
        // Update display
        updateSelectedFiltersDisplay($wrapper);
        
        // Reload posts
        loadPosts($wrapper, 1);
    }
    
        // Generate skeleton loading cards
    function generateSkeletonCards(count, settings) {
        let gridColumns = settings.grid_columns || 3;
        let gridColumnsTablet = settings.grid_columns_tablet || 2;
        let gridColumnsMobile = settings.grid_columns_mobile || 1;
        
        // Check if skeleton is enabled
        if (settings.show_skeleton !== 'yes') {
            return '';
        }
        
        let skeletonHtml = '';
        for (let i = 0; i < count; i++) {
            let layoutClass = settings.skeleton_layout || 'image-top';
            
            skeletonHtml += `
                <div class="gpw-skeleton-card gpw-skeleton-${layoutClass}">
                    ${generateSkeletonImage(settings)}
                    <div class="gpw-skeleton-content">
                        ${generateSkeletonContent(settings)}
                    </div>
                </div>
            `;
        }
        
        return skeletonHtml;
    }
    
    // Generate skeleton image based on layout
    function generateSkeletonImage(settings) {
        if (settings.skeleton_image !== 'yes') {
            return '';
        }
        
        return '<div class="gpw-skeleton-image"></div>';
    }
    
    // Generate skeleton content based on user order
    function generateSkeletonContent(settings) {
        let content = '';
        
        // Use custom content order if set, otherwise use default
        let contentOrder = settings.skeleton_content_order && settings.skeleton_content_order.length > 0 
            ? settings.skeleton_content_order 
            : [
                {element: 'title'},
                {element: 'excerpt'},
                {element: 'meta'}
            ];
        
        contentOrder.forEach(item => {
            switch(item.element) {
                case 'title':
                    if (settings.skeleton_title === 'yes') {
                        content += '<div class="gpw-skeleton-title"></div>';
                    }
                    break;
                case 'excerpt':
                    if (settings.skeleton_excerpt === 'yes') {
                        content += `
                            <div class="gpw-skeleton-excerpt">
                                ${generateSkeletonLines(settings.skeleton_lines || 3)}
                            </div>
                        `;
                    }
                    break;
                case 'meta':
                    if (settings.skeleton_meta === 'yes') {
                        content += `
                            <div class="gpw-skeleton-meta">
                                <div class="gpw-skeleton-date"></div>
                                <div class="gpw-skeleton-category"></div>
                            </div>
                        `;
                    }
                    break;
            }
        });
        
        return content;
    }
    
    // Generate skeleton lines based on user setting
    function generateSkeletonLines(count) {
        let lines = '';
        for (let i = 0; i < count; i++) {
            lines += '<div class="gpw-skeleton-line"></div>';
        }
        return lines;
    }
    
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
    
    // Initialize widgets
    $('.gpw-wrapper').each(function() {
        let $wrapper = $(this);
        let settings = $wrapper.data('settings');
        
        // Initialize filters
        pendingFilters = {};
        appliedFilters = {};
        
        // Initial load
        loadPosts($wrapper, 1);
        
        // Initially hide filter action buttons and filters indicator
        $wrapper.find('.gpw-filter-actions').hide();
        $wrapper.find('.gpw-filters-indicator').hide();
        
        // Initialize accordion counts
        updateAccordionCounts($wrapper);
        
        // Search handler with debounce
        if (settings.show_search === 'yes') {
            let debouncedSearch = debounce(function() {
                // Update search term in applied filters
                let searchTerm = $wrapper.find('.gpw-search').val();
                appliedFilters.search = searchTerm;
                loadPosts($wrapper, 1);
            }, 500);
            
            $wrapper.on('keyup', '.gpw-search', debouncedSearch);
            
            // Add input event for immediate feedback
            $wrapper.on('input', '.gpw-search', function() {
                let searchTerm = $(this).val();
                let $clearBtn = $wrapper.find('.gpw-search-clear');
                
                // Show/hide clear button
                if (searchTerm.length > 0) {
                    $clearBtn.fadeIn(200);
                } else {
                    $clearBtn.fadeOut(200);
                }
            });
            
            // Clear search button
            $wrapper.on('click', '.gpw-search-clear', function() {
                $wrapper.find('.gpw-search').val('');
                appliedFilters.search = '';
                loadPosts($wrapper, 1);
                $(this).fadeOut(200);
            });
        }
        
        // Filter change handlers - update pending filters display and auto-apply if empty
        $wrapper.on('change', '.gpw-acf-filter, .gpw-tax-filter, .gpw-date-filter-from, .gpw-date-filter-to', function() {
            updateSelectedFiltersDisplay($wrapper);
            let pending = collectPendingFilters($wrapper);
            if (isEmptyFilters(pending)) {
                applyFilters($wrapper);
            }
        });
        
        // Remove selected filter tag
        $wrapper.on('click', '.gpw-remove-tag', function(e) {
            e.preventDefault();
            removeSelectedFilter($wrapper, $(this).closest('.gpw-selected-tag'));
        });
        
        // Confirm filters button
        $wrapper.on('click', '.gpw-confirm-filters', function(e) {
            e.preventDefault();
            applyFilters($wrapper);
        });
        
        // Reset filters button
        $wrapper.on('click', '.gpw-reset-filters', function(e) {
            e.preventDefault();
            resetFilters($wrapper);
        });
        
        // Pagination handlers
        $wrapper.on('click', '.gpw-page', function(e) {
            e.preventDefault();
            let page = $(this).data('page');
            if (page && page !== currentPage) {
                loadPosts($wrapper, page);
            }
        });
        
        // Load more handler
        $wrapper.on('click', '.gpw-load-more', function(e) {
            e.preventDefault();
            if (currentPage < maxPages && !loading) {
                loadPosts($wrapper, currentPage + 1, true);
            }
        });
        
        // Setup infinite scroll if enabled
        if (settings.show_pagination === 'yes' && settings.pagination_type === 'infinite') {
            setupInfiniteScroll($wrapper);
        }
        
        // Setup accordion toggle if using accordion layout
        if (settings.filters_layout === 'accordion') {
            setupAccordionToggle($wrapper);
        }
        
        // Setup filter sidebar toggle
        setupFilterSidebarToggle($wrapper);
    });
    
    // Setup mutation observer for each wrapper
    function setupMutationObserver($wrapper) {
        if (!window.MutationObserver) return;
        
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1 && node.classList.contains('gpw-post')) {
                            setupInfiniteScroll($wrapper);
                        }
                    });
                }
            });
        });
        
        observer.observe($wrapper[0], {
            childList: true,
            subtree: true
        });
        
        // Store observer reference for cleanup
        $wrapper.data('mutationObserver', observer);
    }
    
    // Setup mutation observer for each wrapper
    $('.gpw-wrapper').each(function() {
        let $wrapper = $(this);
        setupMutationObserver($wrapper);
    });
    
    // Cleanup observers on page unload
    $(window).on('beforeunload', function() {
        $('.gpw-wrapper').each(function() {
            cleanupObservers($(this));
        });
    });
});


document.addEventListener("DOMContentLoaded", () => {
    const darkRGB = "rgb(0, 19, 25)";   // your real dark color #001319
    const whiteRGB = "rgb(255, 255, 255)";

    const lightBtn = document.getElementById("lightToggle");
    const darkBtn = document.getElementById("darkToggle");

    function setLightMode() {
        const allElements = document.querySelectorAll(
            "*:not(footer):not(footer *):not(.no-theme-switch):not(.no-theme-switch *)"
        );

        allElements.forEach(el => {
            const style = getComputedStyle(el);
            let changed = false;

            // Background swap
            if (style.backgroundColor === darkRGB) {
                el.style.backgroundColor = whiteRGB;
                el.dataset.prevBg = darkRGB;
                changed = true;
            } else if (style.backgroundColor === whiteRGB) {
                el.style.backgroundColor = darkRGB;
                el.dataset.prevBg = whiteRGB;
                changed = true;
            }

            // Text color swap
            if (style.color === darkRGB) {
                el.style.color = whiteRGB;
                el.dataset.prevColor = darkRGB;
                changed = true;
            } else if (style.color === whiteRGB) {
                el.style.color = darkRGB;
                el.dataset.prevColor = whiteRGB;
                changed = true;
            }

            // Border color swap
            ["Top", "Right", "Bottom", "Left"].forEach(side => {
                const key = "border" + side + "Color";
                if (style[key] === darkRGB) {
                    el.style[key] = whiteRGB;
                    el.dataset["prevBorder" + side] = darkRGB;
                    changed = true;
                } else if (style[key] === whiteRGB) {
                    el.style[key] = darkRGB;
                    el.dataset["prevBorder" + side] = whiteRGB;
                    changed = true;
                }
            });

            // SVG stroke/fill swap
            const tagName = el.tagName.toLowerCase();
            if (["svg", "path", "circle", "rect", "g"].includes(tagName)) {
                if (style.fill === darkRGB) {
                    el.style.fill = whiteRGB;
                    el.dataset.prevFill = darkRGB;
                    changed = true;
                } else if (style.fill === whiteRGB) {
                    el.style.fill = darkRGB;
                    el.dataset.prevFill = whiteRGB;
                    changed = true;
                }

                if (style.stroke === darkRGB) {
                    el.style.stroke = whiteRGB;
                    el.dataset.prevStroke = darkRGB;
                    changed = true;
                } else if (style.stroke === whiteRGB) {
                    el.style.stroke = darkRGB;
                    el.dataset.prevStroke = whiteRGB;
                    changed = true;
                }
            }

            if (changed) {
                el.dataset.lightMode = "true";
            }
        });
    }

    function setDarkMode() {
        const modifiedElements = document.querySelectorAll("[data-light-mode='true']");
        modifiedElements.forEach(el => {
            if (el.dataset.prevBg) {
                el.style.backgroundColor = el.dataset.prevBg;
                delete el.dataset.prevBg;
            }
            if (el.dataset.prevColor) {
                el.style.color = el.dataset.prevColor;
                delete el.dataset.prevColor;
            }
            ["Top", "Right", "Bottom", "Left"].forEach(side => {
                const key = "prevBorder" + side;
                if (el.dataset[key]) {
                    el.style["border" + side + "Color"] = el.dataset[key];
                    delete el.dataset[key];
                }
            });
            if (el.dataset.prevFill) {
                el.style.fill = el.dataset.prevFill;
                delete el.dataset.prevFill;
            }
            if (el.dataset.prevStroke) {
                el.style.stroke = el.dataset.prevStroke;
                delete el.dataset.prevStroke;
            }
            delete el.dataset.lightMode;
        });
    }

    function activateLightMode() {
        if (!lightBtn) return;
        if (lightBtn.classList.contains("active")) return;
        document.body.classList.remove("dark-theme");
        document.body.classList.add("light-theme");
        lightBtn.classList.add("active");
        lightBtn.classList.remove("inactive");
        if (darkBtn) {
            darkBtn.classList.remove("active");
            darkBtn.classList.add("inactive");
        }
        setLightMode();

        // save state
        localStorage.setItem("theme", "light");
    }

    function activateDarkMode() {
        if (!darkBtn) return;
        if (darkBtn.classList.contains("active")) return;
        document.body.classList.remove("light-theme");
        document.body.classList.add("dark-theme");
        darkBtn.classList.add("active");
        darkBtn.classList.remove("inactive");
        if (lightBtn) {
            lightBtn.classList.remove("active");
            lightBtn.classList.add("inactive");
        }
        setDarkMode();

        // save state
        localStorage.setItem("theme", "dark");
    }

    // ✅ Restore saved theme on page load
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
        activateLightMode();
    } else if (savedTheme === "dark") {
        activateDarkMode();
    }

    // Event binding
    if (lightBtn) lightBtn.addEventListener("click", activateLightMode);
    if (darkBtn) darkBtn.addEventListener("click", activateDarkMode);
});



