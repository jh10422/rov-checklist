/**
 * ROV Checklist System - Shared JavaScript Functions
 * This file contains all the common functionality shared across checklist pages
 */

class ROVChecklistApp {
    constructor(config = {}) {
        this.config = {
            hasPages: config.hasPages || false,
            hasSubTabs: config.hasSubTabs || false,
            hasQuestions: config.hasQuestions || false,
            useNativeScroll: config.useNativeScroll || false,
            pageTitles: config.pageTitles || [],
            nextPageUrl: config.nextPageUrl || null,
            ...config
        };
        
        this.currentPage = 0;
        this.currentZoom = 1.0;
        this.scrollPositions = [];
        
        this.initializeElements();
        this.initializeEventListeners();
        this.initialize();
    }

    initializeElements() {
        // Core elements
        this.body = document.body;
        this.themeToggle = document.getElementById('theme-toggle');
        this.zoomInBtn = document.getElementById('zoom-in-btn');
        this.zoomOutBtn = document.getElementById('zoom-out-btn');
        this.progressText = document.getElementById('progress-text');
        this.pageContent = document.getElementById('page-content');
        this.scrollUpBtn = document.getElementById('scroll-up-btn');
        this.scrollDownBtn = document.getElementById('scroll-down-btn');
        
        // Page navigation elements
        this.pages = document.querySelectorAll('.page');
        this.subTabs = document.querySelectorAll('.sub-tab');
        this.prevBtn = document.getElementById('prev-page-btn');
        this.nextBtn = document.getElementById('next-page-btn');
        this.pageIndicator = document.getElementById('page-indicator');
        this.tabTitle = document.getElementById('tab-title');
        this.pagerControls = document.getElementById('pager-controls');
        this.nextChecklistBtn = document.getElementById('next-checklist-btn');
        
        // Checklist elements
        this.checklistItems = document.querySelectorAll('.checklist-item');
        this.optionBtns = document.querySelectorAll('.options-row .option-btn');
        
        // Scroll wrapper - check for native scroll config
        this.scrollWrapper = document.querySelector('.scroll-wrapper');
        if (this.config.useNativeScroll && this.scrollWrapper) {
            this.scrollWrapper.classList.add('native-scroll');
        }
        
        // Initialize scroll positions array if we have pages
        if (this.config.hasPages) {
            this.totalPages = this.pages.length;
            this.scrollPositions = Array(this.totalPages).fill(0);
        }
    }

    initializeEventListeners() {
        // Theme and zoom controls
        this.themeToggle?.addEventListener('click', () => this.toggleTheme());
        this.zoomInBtn?.addEventListener('click', () => this.adjustZoom(0.1));
        this.zoomOutBtn?.addEventListener('click', () => this.adjustZoom(-0.1));
        
        // Scroll controls
        this.scrollUpBtn?.addEventListener('click', () => this.scrollContent('up'));
        this.scrollDownBtn?.addEventListener('click', () => this.scrollContent('down'));
        
        // Page navigation
        if (this.config.hasSubTabs) {
            this.subTabs.forEach((tab, index) => {
                tab.addEventListener('click', () => this.showPage(index));
            });
        }
        
        if (this.config.hasPages) {
            this.prevBtn?.addEventListener('click', () => this.navigatePage(-1));
            this.nextBtn?.addEventListener('click', () => this.navigatePage(1));
        }
        
        // Checklist interactions
        this.checklistItems.forEach(item => {
            if (!item.classList.contains('is-question')) {
                item.addEventListener('click', (e) => this.handleChecklistClick(e, item));
            }
        });
        
        // Question option buttons
        this.optionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleOptionClick(e, btn));
        });
        
        // Native scroll listener for certain pages
        if (this.config.useNativeScroll) {
             this.pages.forEach(page => {
                const wrapper = page.querySelector('.scroll-wrapper');
                if(wrapper) {
                    wrapper.addEventListener('scroll', () => this.updateScrollState());
                }
            });
        }
        
        // Window resize listener
        window.addEventListener('resize', () => this.updateScrollState());
    }

    // Theme Management
    toggleTheme() {
        this.body.classList.toggle('light-mode');
        const currentTheme = this.body.classList.contains('light-mode') ? 'light-mode' : 'dark-mode';
        this.themeToggle.textContent = this.body.classList.contains('light-mode') ? 'DARK MODE' : 'LIGHT MODE';
        localStorage.setItem('theme', currentTheme);
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light-mode';
        if (savedTheme === 'dark-mode') {
            this.body.classList.remove('light-mode');
        } else {
            this.body.classList.add('light-mode');
        }
        if (this.themeToggle) {
            this.themeToggle.textContent = this.body.classList.contains('light-mode') ? 'DARK MODE' : 'LIGHT MODE';
        }
    }

    // Zoom Management
    adjustZoom(delta) {
        this.currentZoom = Math.max(0.5, Math.min(this.currentZoom + delta, 2.0));
        this.body.style.zoom = this.currentZoom;
        localStorage.setItem('rovChecklistZoom', this.currentZoom);
    }

    loadZoom() {
        this.currentZoom = parseFloat(localStorage.getItem('rovChecklistZoom')) || 1.0;
        this.body.style.zoom = this.currentZoom;
    }

    // Scroll Management
    updateScrollState() {
        if (this.config.useNativeScroll) {
            this.updateNativeScrollState();
        } else {
            this.updateTransformScrollState();
        }
    }

    updateNativeScrollState() {
        const activeWrapper = this.config.hasPages 
            ? document.querySelector('.page.active .scroll-wrapper')
            : this.scrollWrapper;
        if (!activeWrapper) return;
        
        setTimeout(() => {
            const canScroll = activeWrapper.scrollHeight > activeWrapper.clientHeight;
            if (!canScroll) {
                this.scrollUpBtn.disabled = true;
                this.scrollDownBtn.disabled = true;
                return;
            }
            this.scrollUpBtn.disabled = activeWrapper.scrollTop <= 0;
            this.scrollDownBtn.disabled = activeWrapper.scrollTop >= (activeWrapper.scrollHeight - activeWrapper.clientHeight - 1);
        }, 50);
    }

    updateTransformScrollState() {
        const activeWrapper = this.config.hasPages 
            ? document.querySelector('.page.active .scroll-wrapper')
            : this.scrollWrapper;
            
        if (!activeWrapper || !activeWrapper.firstElementChild) return;

        const contentHeight = activeWrapper.firstElementChild.scrollHeight;
        const containerHeight = this.pageContent.clientHeight;
        const currentScroll = this.config.hasPages ? this.scrollPositions[this.currentPage] : this.scrollPosition || 0;
        
        if (contentHeight <= containerHeight) {
            this.scrollUpBtn.disabled = true;
            this.scrollDownBtn.disabled = true;
            // Reset scroll position if content becomes unscrollable
            if (this.config.hasPages && this.scrollPositions[this.currentPage] !== 0) {
                this.scrollPositions[this.currentPage] = 0;
                activeWrapper.style.transform = `translateY(0px)`;
            }
            return;
        }

        this.scrollUpBtn.disabled = currentScroll >= 0;
        
        const maxScroll = -(contentHeight - containerHeight + 20); // Adjusted buffer
        
        this.scrollDownBtn.disabled = currentScroll <= maxScroll;
    }


    scrollContent(direction, amount = null) {
        if (this.config.useNativeScroll) {
            this.scrollContentNative(direction, amount);
        } else {
            this.scrollContentTransform(direction, amount);
        }
    }

    scrollContentNative(direction, amount = null) {
        const activeWrapper = this.config.hasPages 
            ? document.querySelector('.page.active .scroll-wrapper')
            : this.scrollWrapper;
        if (!activeWrapper) return;
        const scrollStep = amount !== null ? amount : activeWrapper.clientHeight * 0.7;
        if (direction === 'down') {
            activeWrapper.scrollTop += scrollStep;
        } else {
            activeWrapper.scrollTop -= scrollStep;
        }
    }

    scrollContentTransform(direction, amount = null) {
        const activeWrapper = this.config.hasPages 
            ? document.querySelector('.page.active .scroll-wrapper')
            : this.scrollWrapper;
            
        if (!activeWrapper || !activeWrapper.firstElementChild) return;

        const containerHeight = this.pageContent.clientHeight;
        const contentHeight = activeWrapper.firstElementChild.scrollHeight;
        const scrollStep = amount !== null ? amount : containerHeight * 0.7;
        
        let newScrollY = this.config.hasPages ? this.scrollPositions[this.currentPage] : this.scrollPosition || 0;
        if (direction === 'down') {
            newScrollY -= scrollStep;
        } else {
            newScrollY += scrollStep;
        }

        const maxScroll = -(contentHeight - containerHeight + 20); // Adjusted buffer
        
        newScrollY = Math.max(newScrollY, maxScroll);
        newScrollY = Math.min(newScrollY, 0);

        if (this.config.hasPages) {
            this.scrollPositions[this.currentPage] = newScrollY;
        } else {
            this.scrollPosition = newScrollY;
        }
        activeWrapper.style.transform = `translateY(${newScrollY}px)`;
        this.updateScrollState();
    }

    scrollIntoViewIfNeeded(element) {
        if (!element) return;
        setTimeout(() => {
            const itemRect = element.getBoundingClientRect();
            const containerRect = this.pageContent.getBoundingClientRect();
            if (itemRect.bottom > containerRect.bottom - 100) {
                const scrollAmount = itemRect.bottom - containerRect.bottom + 150;
                this.scrollContent('down', scrollAmount);
                setTimeout(() => this.updateScrollState(), 50);
            }
        }, 100);
    }

    // Page Navigation
    showPage(pageIndex) {
        if (!this.config.hasPages) return;
        
        this.currentPage = pageIndex;
        this.pages.forEach((page, index) => {
            page.classList.toggle('active', index === pageIndex);
            const scrollWrapper = page.querySelector('.scroll-wrapper');
            if (scrollWrapper && !this.config.useNativeScroll) {
                scrollWrapper.style.transform = `translateY(${this.scrollPositions[index]}px)`;
            }
        });
        
        if (this.config.hasSubTabs) {
            this.subTabs.forEach((tab, index) => {
                tab.classList.toggle('active', index === pageIndex);
            });
        }
        
        if (this.tabTitle && this.config.pageTitles[pageIndex]) {
            this.tabTitle.textContent = this.config.pageTitles[pageIndex];
        }
        
        if (this.pageIndicator) {
            this.pageIndicator.textContent = `${pageIndex + 1} / ${this.totalPages}`;
        }
        
        if (this.prevBtn) this.prevBtn.disabled = pageIndex === 0;
        if (this.nextBtn) this.nextBtn.disabled = pageIndex === this.totalPages - 1;
        
        if (this.nextBtn) {
            this.nextBtn.classList.remove('highlighted');
        }
        
        this.updateFooter();
        
        setTimeout(() => {
            this.updateScrollState();
            this.updateProgress();
        }, 50);
    }

    navigatePage(direction) {
        const newPage = this.currentPage + direction;
        if (newPage >= 0 && newPage < this.totalPages) {
            this.showPage(newPage);
        }
    }

    // Checklist Management
    handleChecklistClick(e, item) {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') return;
        
        item.classList.toggle('checked');
        this.updateProgress();
        
        this.handleSpecialItemBehaviors(item);
        
        const prereqFor = item.dataset.prereqFor;
        if (prereqFor) {
            const allPrereqs = document.querySelectorAll(`[data-prereq-for="${prereqFor}"]`);
            const allMet = [...allPrereqs].every(pr => pr.classList.contains('checked'));
            
            if (allMet) {
                const questionElement = document.getElementById(prereqFor);
                setTimeout(() => this.scrollIntoViewIfNeeded(questionElement), 100);
            }
        }

        this.handleAutoScroll(item);
    }

    handleAutoScroll(item) {
        if (!this.config.hasPages) return;
        
        const activeWrapper = document.querySelector('.page.active .scroll-wrapper');
        if (!activeWrapper) return;
        
        const itemsOnCurrentPage = [...activeWrapper.querySelectorAll('.checklist-item')];
        const containerRect = this.pageContent.getBoundingClientRect();
        
        const lastVisibleItem = itemsOnCurrentPage.filter(i => {
            const itemRect = i.getBoundingClientRect();
            return itemRect.top >= containerRect.top && itemRect.bottom <= containerRect.bottom;
        }).pop();

        if (item === lastVisibleItem) {
            const allVisibleChecked = [...itemsOnCurrentPage].filter(i => {
                 const itemRect = i.getBoundingClientRect();
                 return itemRect.top >= containerRect.top && itemRect.bottom <= containerRect.bottom;
            }).every(i => i.classList.contains('checked'));

            if (allVisibleChecked && this.scrollDownBtn && !this.scrollDownBtn.disabled) {
                setTimeout(() => this.scrollContent('down'), 300);
            }
        }
    }

    handleSpecialItemBehaviors(item) {
        // Override
    }

    handleOptionClick(e, btn) {
        if (btn.disabled) return;

        const choice = e.target.dataset.choice;
        const questionRow = e.target.closest('.options-row');
        if (!questionRow) return;
        
        const questionId = questionRow.dataset.question;
        const questionItem = document.getElementById(questionId);

        questionItem.classList.add('checked');

        questionRow.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        e.target.classList.add('selected');
        questionRow.classList.add('selection-made');
        questionRow.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
        
        this.handleSpecialQuestionBehaviors(questionId, choice);
        
        document.querySelectorAll(`[data-path]`).forEach(el => {
           if(el.dataset.path.startsWith(questionId) && !el.dataset.path.includes(`${questionId}-${choice}`)) {
               el.style.display = 'none';
           }
        });

        const pathToShow = `[data-path*="${questionId}-${choice}"]`;
        document.querySelectorAll(pathToShow).forEach(el => {
            el.style.display = el.tagName === 'TR' ? 'table-row' : 'block';
        });

        this.handleSharedPaths(questionId, choice);
        
        this.updateProgress();
        
        setTimeout(() => {
            this.updateScrollState();
            const newlyShownItems = document.querySelectorAll(pathToShow);
            if (newlyShownItems.length > 0) {
                const lastNewItem = newlyShownItems[newlyShownItems.length - 1];
                this.scrollIntoViewIfNeeded(lastNewItem);
            }
        }, 100);
    }

    handleSpecialQuestionBehaviors(questionId, choice) {
        // Override
    }

    handleSharedPaths(questionId, choice) {
        // Override
    }

    // Progress and Completion Management
    updateProgress() {
        if (this.config.hasPages) {
            this.updateProgressMultiPage();
        } else {
            this.updateProgressSinglePage();
        }
        
        this.checkPrerequisites();
        this.updateFooter();
    }

    updateProgressSinglePage() {
        const visibleCheckableItems = document.querySelectorAll('.checklist-item:not(.is-question):not(.conditional), .checklist-item:not(.is-question).conditional[style*="table-row"]');
        const checkedVisibleItems = [...visibleCheckableItems].filter(item => item.classList.contains('checked'));
        
        const totalVisible = visibleCheckableItems.length;
        const checkedCount = checkedVisibleItems.length;
        
        if (this.progressText) {
            this.progressText.textContent = `${checkedCount} / ${totalVisible} ITEMS COMPLETE`;
        }
        
        this.checkCompletion(checkedCount, totalVisible);
        this.updateScrollState();
    }

    updateProgressMultiPage() {
        const currentPageElement = document.querySelector('.page.active');
        if (!currentPageElement) return;
        const visibleCheckableItems = currentPageElement.querySelectorAll('.checklist-item:not(.is-question):not(.conditional), .checklist-item:not(.is-question).conditional[style*="table-row"]');
        const checkedVisibleItems = [...visibleCheckableItems].filter(item => item.classList.contains('checked'));
        
        const totalVisible = visibleCheckableItems.length;
        const checkedCount = checkedVisibleItems.length;
        
        if (this.progressText) {
            this.progressText.textContent = `${checkedCount} / ${totalVisible} ITEMS COMPLETE`;
        }
        
        this.checkTabCompletion();
        this.checkOverallCompletion();
        this.updateScrollState();
    }

    checkCompletion() {
        const missionComplete = this.checkMissionComplete();
        if (this.progressText) {
            const visibleItems = document.querySelectorAll('.page.active .checklist-item:not(.is-question):not(.conditional), .page.active .checklist-item:not(.is-question).conditional[style*="table-row"]');
            const checkedItems = document.querySelectorAll('.page.active .checklist-item.checked:not(.is-question):not(.conditional), .page.active .checklist-item.checked:not(.is-question).conditional[style*="table-row"]');
            this.progressText.textContent = `${checkedItems.length} / ${visibleItems.length} ITEMS COMPLETE`;

            if (missionComplete) {
                this.progressText.textContent += ' -- MISSION READY';
                this.progressText.style.color = 'var(--complete-color)';
            } else {
                this.progressText.style.color = 'var(--dim-text-color)';
            }
        }
        if (this.pagerControls) {
             this.pagerControls.style.display = missionComplete ? 'none' : 'flex';
        }
        if (this.nextChecklistBtn) {
            this.nextChecklistBtn.style.display = missionComplete ? 'block' : 'none';
        }
    }

    checkMissionComplete() {
        // Override
        return false;
    }
}

// --- NEW TROUBLESHOOTING CLASSES ---

class CSBatteryFailureChecklist extends TroubleshootingApp {
    constructor() {
        super();
    }

    handleSpecialItemBehaviors(item) {
        if (item.id === 'battery-power-button-item') {
            const instructions = document.getElementById('battery-instructions');
            const abortAction = document.getElementById('battery-abort-action');
            const q1Row = document.querySelector('[data-question="q1"]');
            
            if (item.classList.contains('checked')) {
                instructions.style.display = 'table-row';
                abortAction.style.display = 'table-row';
                q1Row.classList.remove('selection-made');
                q1Row.querySelectorAll('.option-btn').forEach(btn => {
                    btn.disabled = false;
                    btn.classList.remove('selected');
                });
                document.getElementById('q1').classList.remove('checked');
                this.scrollIntoViewIfNeeded(abortAction);
            } else {
                instructions.style.display = 'none';
                abortAction.style.display = 'none';
            }
        }

        if (['q3-battery-off-item', 'q3-battery-on-item', 'q3-dc-output-item'].includes(item.id)) {
            const allChecked = ['q3-battery-off-item', 'q3-battery-on-item', 'q3-dc-output-item']
                .every(id => document.getElementById(id)?.classList.contains('checked'));

            if (allChecked) {
                const instructions = document.getElementById('q3-instructions');
                const abortAction = document.getElementById('q3-abort-action');
                instructions.style.display = 'table-row';
                abortAction.style.display = 'table-row';
                const q3Row = document.querySelector('[data-question="q3"]');
                q3Row.classList.remove('selection-made');
                q3Row.querySelectorAll('.option-btn').forEach(btn => {
                    btn.disabled = false;
                    btn.classList.remove('selected');
                });
                document.getElementById('q3').classList.remove('checked');
                this.scrollIntoViewIfNeeded(abortAction);
            }
        }
    }

    handleSpecialQuestionBehaviors(questionId, choice) {
        if (questionId === 'q1' && choice === 'yes') {
            document.getElementById('battery-instructions').style.display = 'none';
            document.getElementById('battery-abort-action').style.display = 'none';
        }
        if (questionId === 'q3' && choice === 'yes') {
            document.getElementById('q3-instructions').style.display = 'none';
            document.getElementById('q3-abort-action').style.display = 'none';
        }
    }

    checkMissionComplete() {
        return document.querySelector('.instruction.success[data-path="q4-yes"]')?.style.display === 'table-row';
    }
}

class VehConnectIssuesChecklist extends TroubleshootingApp {
    constructor() {
        super({
            hasPages: true,
            hasSubTabs: true,
            pageTitles: ['PHYSICAL CONNECTION', 'SOFTWARE CONNECTION', 'VEHICLE CONNECTION']
        });
    }
    
    showPage(pageIndex) {
        // Hide all conditional items when switching pages to prevent bleed-over
        document.querySelectorAll('.conditional').forEach(el => el.style.display = 'none');
        super.showPage(pageIndex);
    }

    handleSharedPaths(questionId, choice) {
        if (questionId === 'vc-q1') {
            const sharedPathItems = document.querySelectorAll('[data-path*="vc-q1-no,vc-q1-yes"], [data-path*="vc-q1-yes,vc-q1-no"]');
            sharedPathItems.forEach(el => {
                el.style.display = el.tagName === 'TR' ? 'table-row' : 'block';
            });
        }
    }
    
    handleSpecialItemBehaviors(item) {
        if (item.id === 'blueos-restart-item') {
            const instruction = document.getElementById('blueos-restart-instruction');
            if (item.classList.contains('checked')) {
                instruction.style.display = 'table-row';
                const qRow = document.querySelector('[data-question="sw-q2"]');
                qRow.classList.remove('selection-made');
                qRow.querySelectorAll('.option-btn').forEach(btn => { btn.disabled = false; btn.classList.remove('selected'); });
                document.getElementById('sw-q2').classList.remove('checked');
                this.scrollIntoViewIfNeeded(instruction);
            } else {
                instruction.style.display = 'none';
            }
        }
        if (item.id === 'vc-battery-check-item') {
            const instruction1 = document.getElementById('vc-battery-try-again-instruction');
            const instruction2 = document.getElementById('vc-q2b-reselect-instruction');
             if (item.classList.contains('checked')) {
                instruction1.style.display = 'table-row';
                instruction2.style.display = 'table-row';
                const qRow = document.querySelector('[data-question="vc-q2b"]');
                qRow.classList.remove('selection-made');
                qRow.querySelectorAll('.option-btn').forEach(btn => { btn.disabled = false; btn.classList.remove('selected'); });
                document.getElementById('vc-q2b').classList.remove('checked');
                this.scrollIntoViewIfNeeded(instruction1);
            } else {
                instruction1.style.display = 'none';
                instruction2.style.display = 'none';
            }
        }
         if (item.id === 'vc-blueos-wait-item') {
            const instruction = document.getElementById('vc-blueos-restore-instruction');
             if (item.classList.contains('checked')) {
                instruction.style.display = 'table-row';
                const qRow = document.querySelector('[data-question="vc-q2"]');
                qRow.classList.remove('selection-made');
                qRow.querySelectorAll('.option-btn').forEach(btn => { btn.disabled = false; btn.classList.remove('selected'); });
                document.getElementById('vc-q2').classList.remove('checked');
                this.scrollIntoViewIfNeeded(instruction);
            } else {
                instruction.style.display = 'none';
            }
        }
    }

    handleSpecialQuestionBehaviors(questionId, choice) {
        if (questionId === 'sw-q2' && choice === 'yes') {
            document.getElementById('blueos-restart-instruction').style.display = 'none';
        }
        if (questionId === 'vc-q2b' && choice === 'yes') {
            document.getElementById('vc-battery-try-again-instruction').style.display = 'none';
            document.getElementById('vc-q2b-reselect-instruction').style.display = 'none';
        }
        if (questionId === 'vc-q2' && choice === 'yes') {
            document.getElementById('vc-blueos-restore-instruction').style.display = 'none';
        }
    }
    
    checkTabCompletion() {
        const proceedToEndpoints = [
            '[data-path="q1-no"]',
            '[data-path="q2-no"]',
            '[data-path="q3-no"]',
            '[data-path="sw-q1-no"]',
            '[data-path="sw-q3-no"]',
            '#blueos-restart-instruction'
        ];
        
        const shouldHighlight = proceedToEndpoints.some(selector => {
            const el = document.querySelector(`.page.active ${selector}`);
            return el && el.style.display !== 'none';
        });

        if (this.nextBtn) {
            if (shouldHighlight && this.currentPage < this.totalPages - 1) {
                this.nextBtn.classList.add('highlighted');
            } else {
                this.nextBtn.classList.remove('highlighted');
            }
        }
    }

    checkMissionComplete() {
        return document.querySelector('.instruction.success[data-path="q3-yes"]')?.style.display === 'table-row' ||
               document.querySelector('.instruction.success[data-path="sw-q3-yes"]')?.style.display === 'table-row' ||
               document.querySelector('.instruction.success[data-path="vc-q4-yes"]')?.style.display === 'table-row';
    }
}

class VehFunctionChecklist extends TroubleshootingApp {
    constructor() {
        super({useNativeScroll: true});
    }

    handleSpecialItemBehaviors(item) {
        if (['blueos-restart-item', 'vehicle-arming-retry-item'].includes(item.id)) {
            const bothChecked = ['blueos-restart-item', 'vehicle-arming-retry-item']
                .every(id => document.getElementById(id)?.classList.contains('checked'));
            
            const instruction = document.getElementById('q1-retry-instruction');
            if (bothChecked) {
                instruction.style.display = 'table-row';
                const qRow = document.querySelector('[data-question="q1"]');
                qRow.classList.remove('selection-made');
                qRow.querySelectorAll('.option-btn').forEach(btn => { btn.disabled = false; btn.classList.remove('selected'); });
                document.getElementById('q1').classList.remove('checked');
                this.scrollIntoViewIfNeeded(instruction);
            } else {
                instruction.style.display = 'none';
            }
        }
    }
    
    handleSpecialQuestionBehaviors(questionId, choice) {
        if (questionId === 'q1' && choice === 'yes') {
            document.getElementById('q1-retry-instruction').style.display = 'none';
        }
    }

    checkMissionComplete() {
        return document.querySelector('.instruction.success[data-path="q1-yes"]')?.style.display === 'table-row';
    }
}

class VehArmingChecklist extends TroubleshootingApp {
    constructor() {
        super({useNativeScroll: true});
    }

    handleSpecialItemBehaviors(item) {
        if (item.id === 'vehicle-arming-retry-item') {
            const instruction = document.getElementById('q3-retry-instruction');
            if (item.classList.contains('checked')) {
                instruction.style.display = 'table-row';
                const qRow = document.querySelector('[data-question="q3"]');
                qRow.classList.remove('selection-made');
                qRow.querySelectorAll('.option-btn').forEach(btn => { btn.disabled = false; btn.classList.remove('selected'); });
                document.getElementById('q3').classList.remove('checked');
                this.scrollIntoViewIfNeeded(instruction);
            } else {
                instruction.style.display = 'none';
            }
        }
        if (item.id === 'blueos-restart-item') {
            const instruction = document.getElementById('q2-retry-instruction');
            if (item.classList.contains('checked')) {
                instruction.style.display = 'table-row';
                const qRow = document.querySelector('[data-question="q2"]');
                qRow.classList.remove('selection-made');
                qRow.querySelectorAll('.option-btn').forEach(btn => { btn.disabled = false; btn.classList.remove('selected'); });
                document.getElementById('q2').classList.remove('checked');
                this.scrollIntoViewIfNeeded(instruction);
            } else {
                instruction.style.display = 'none';
            }
        }
    }
    
    handleSpecialQuestionBehaviors(questionId, choice) {
        if (questionId === 'q3' && choice === 'yes') {
            document.getElementById('q3-retry-instruction').style.display = 'none';
        }
         if (questionId === 'q2' && choice === 'yes') {
            document.getElementById('q2-retry-instruction').style.display = 'none';
        }
    }

    checkMissionComplete() {
        return document.querySelector('.instruction.success[data-path="q3-yes"]')?.style.display === 'table-row';
    }
}

class AbortMissionChecklist extends TroubleshootingApp {
    constructor() {
        super({
            hasPages: true,
            hasSubTabs: true,
            pageTitles: ['IMMEDIATE ACTIONS', 'VEHICLE', 'TETHER', 'CONTROL STATION']
        });
    }

    handleSpecialItemBehaviors(item) {
        if (item.id === 'vehicle-retrieved-item') {
            const instruction = document.getElementById('vehicle-instructions');
            instruction.style.display = item.classList.contains('checked') ? 'table-row' : 'none';
            if(item.classList.contains('checked')) this.scrollIntoViewIfNeeded(instruction);
        }
        if (item.id === 'vehicle-disarm-item') {
            const instruction = document.getElementById('disarm-instructions');
            instruction.style.display = item.classList.contains('checked') ? 'table-row' : 'none';
            if(item.classList.contains('checked')) this.scrollIntoViewIfNeeded(instruction);
        }
        if (this.currentPage === 3) { // Control Station tab
            const csYesItems = document.querySelectorAll('.checklist-item.conditional[data-path="cs-q1-yes"]:not(.is-question)');
            const csNoItems = document.querySelectorAll('.checklist-item.conditional[data-path="cs-q1-no"]:not(.is-question)');
            
            const csYesVisible = [...csYesItems].filter(item => item.style.display === 'table-row');
            const csYesChecked = csYesVisible.filter(item => item.classList.contains('checked'));
            const yesComplete = document.getElementById('cs-yes-complete');
            if(csYesVisible.length > 0 && csYesChecked.length === csYesVisible.length) {
                yesComplete.style.display = 'table-row';
                this.scrollIntoViewIfNeeded(yesComplete);
            } else {
                yesComplete.style.display = 'none';
            }
            
            const csNoVisible = [...csNoItems].filter(item => item.style.display === 'table-row');
            const csNoChecked = csNoVisible.filter(item => item.classList.contains('checked'));
            const noComplete = document.getElementById('cs-no-complete');
            if(csNoVisible.length > 0 && csNoChecked.length === csNoVisible.length) {
                noComplete.style.display = 'table-row';
                this.scrollIntoViewIfNeeded(noComplete);
            } else {
                noComplete.style.display = 'none';
            }
        }
    }
    
    checkTabCompletion() {
        const currentPageElement = document.querySelector('.page.active');
        const items = currentPageElement.querySelectorAll('.checklist-item:not(.is-question)');
        const checked = currentPageElement.querySelectorAll('.checklist-item.checked:not(.is-question)');
        const isChecklistTabComplete = items.length > 0 && items.length === checked.length;

        const isImmediateActionsEndpoint = this.currentPage === 0 && (
            document.getElementById('vehicle-instructions')?.style.display === 'table-row' || 
            document.getElementById('disarm-instructions')?.style.display === 'table-row' ||
            document.querySelector('[data-path="q1-yes"]')?.style.display === 'table-row' ||
            document.querySelector('[data-path="q2-no"]')?.style.display === 'table-row'
        );

        let shouldHighlight = (isChecklistTabComplete || isImmediateActionsEndpoint);

        if (this.nextBtn) {
            if (shouldHighlight && this.currentPage < this.totalPages - 1) {
                this.nextBtn.classList.add('highlighted');
            } else {
                this.nextBtn.classList.remove('highlighted');
            }
        }
    }

    checkOverallCompletion() {
        const csComplete = document.getElementById('cs-yes-complete')?.style.display === 'table-row' || 
                           document.getElementById('cs-no-complete')?.style.display === 'table-row';
        
        const allPreviousTabsDone = [0, 1, 2].every(pageNum => {
            const page = this.pages[pageNum];
            if (!page) return false;
            
            if (pageNum === 0) { // Immediate Actions
                 return document.getElementById('vehicle-instructions')?.style.display === 'table-row' || 
                        document.getElementById('disarm-instructions')?.style.display === 'table-row' ||
                        document.querySelector('[data-path="q1-yes"]')?.style.display === 'table-row' ||
                        document.querySelector('[data-path="q2-no"]')?.style.display === 'table-row';
            } else { // Vehicle & Tether
                const items = page.querySelectorAll('.checklist-item:not(.is-question)');
                const checked = page.querySelectorAll('.checklist-item.checked:not(.is-question)');
                return items.length > 0 && items.length === checked.length;
            }
        });

        if (csComplete && allPreviousTabsDone) {
            this.progressText.textContent += ' -- SYSTEM SECURED';
            this.progressText.style.color = 'var(--complete-color)';
            if (this.pagerControls) this.pagerControls.style.display = 'none';
            if (this.nextChecklistBtn) this.nextChecklistBtn.style.display = 'block';
        }
    }
}


// Export the classes for use in individual pages
if (typeof window !== 'undefined') {
    window.ROVChecklistApp = ROVChecklistApp;
    window.PreFlightChecklist = PreFlightChecklist;
    window.DuringFlightChecklist = DuringFlightChecklist;
    window.PostFlightChecklist = PostFlightChecklist;
    window.HomePageApp = HomePageApp;
    window.WelcomePageApp = WelcomePageApp;
    window.TroubleshootingApp = TroubleshootingApp;
    window.CSBatteryFailureChecklist = CSBatteryFailureChecklist;
    window.VehConnectIssuesChecklist = VehConnectIssuesChecklist;
    window.VehFunctionChecklist = VehFunctionChecklist;
    window.VehArmingChecklist = VehArmingChecklist;
    window.AbortMissionChecklist = AbortMissionChecklist;
}tion(checkedCount, totalVisible) {
        // Override
    }

    checkTabCompletion() {
        // Override
    }

    checkOverallCompletion() {
        // Override
    }

    checkPrerequisites() {
        document.querySelectorAll('.options-row').forEach(row => {
            const questionId = row.dataset.question;
            const prereqItems = document.querySelectorAll(`[data-prereq-for="${questionId}"]`);
            let allPrereqsMet = prereqItems.length === 0; 
            
            if (prereqItems.length > 0) {
                allPrereqsMet = [...prereqItems].every(item => item.classList.contains('checked'));
            }

            row.querySelectorAll('.option-btn').forEach(btn => {
                if(!btn.closest('.options-row').classList.contains('selection-made')) {
                   btn.disabled = !allPrereqsMet;
                }
            });
        });
    }

    updateFooter() {
        // Override
    }

    // Initialization
    initialize() {
        this.loadTheme();
        this.loadZoom();
        this.updateProgress();
        
        if (this.config.hasPages) {
            this.showPage(this.currentPage);
        } else {
            setTimeout(() => this.updateScrollState(), 50);
        }
    }
}

// Specific implementations for different page types

class PreFlightChecklist extends ROVChecklistApp {
    constructor() {
        super({
            hasPages: true,
            hasSubTabs: true,
            hasQuestions: false,
            pageTitles: ['CONTROL STATION', 'VEHICLE', 'TETHER SPOOL', 'SOFTWARE', 'DRY TEST'],
            nextPageUrl: 'during-flight.html'
        });
        
        this.completionMessage = document.getElementById('completion-message-row');
        this.notReadyMessage = document.getElementById('not-ready-message-row');
        this.totalItems = this.checklistItems.length;
    }

    checkTabCompletion() {
        const currentPageElement = document.querySelector('.page.active');
        const visibleCheckableItems = currentPageElement.querySelectorAll('.checklist-item');
        const checkedVisibleItems = [...visibleCheckableItems].filter(item => item.classList.contains('checked'));
        
        const totalVisible = visibleCheckableItems.length;
        const checkedCount = checkedVisibleItems.length;
        const isTabComplete = checkedCount === totalVisible && totalVisible > 0;
        
        // Show "Proceed to next page" for each tab
        const proceedElements = ['control-proceed', 'vehicle-proceed', 'tether-proceed', 'software-proceed'];
        const proceedElement = document.getElementById(proceedElements[this.currentPage]);
        if (proceedElement) {
            const wasHidden = proceedElement.style.display === 'none' || proceedElement.style.display === '';
            proceedElement.style.display = isTabComplete ? 'table-row' : 'none';
            
            if (isTabComplete && wasHidden) {
                setTimeout(() => this.scrollIntoViewIfNeeded(proceedElement), 100);
            }
        }
        
        if (this.nextBtn) {
            if (isTabComplete && this.currentPage < this.totalPages - 1) {
                this.nextBtn.classList.add('highlighted');
            } else {
                this.nextBtn.classList.remove('highlighted');
            }
        }
    }

    updateFooter() {
        const checkedCount = document.querySelectorAll('.checklist-item.checked').length;
        const isComplete = checkedCount === this.totalItems;

        if (isComplete) {
            this.progressText.textContent += ' -- CHECKLIST COMPLETE';
            this.progressText.style.color = 'var(--complete-color)';
            if (this.completionMessage) this.completionMessage.style.display = 'table-row';
            if (this.notReadyMessage) this.notReadyMessage.style.display = 'none';
            if (this.pagerControls) this.pagerControls.style.display = 'none';
            if (this.nextChecklistBtn) this.nextChecklistBtn.style.display = 'block';
        } else {
            this.progressText.style.color = 'var(--dim-text-color)';
            if (this.completionMessage) this.completionMessage.style.display = 'none';
            if (this.notReadyMessage) this.notReadyMessage.style.display = 'table-row';
            if (this.pagerControls) this.pagerControls.style.display = 'flex';
            if (this.nextChecklistBtn) this.nextChecklistBtn.style.display = 'none';
        }
    }
}

class DuringFlightChecklist extends ROVChecklistApp {
    constructor() {
        super({
            hasPages: true,
            hasSubTabs: true,
            hasQuestions: false,
            pageTitles: ['DEPLOYMENT', 'PILOTING', 'MONITORING'],
            nextPageUrl: 'post-flight.html',
            useNativeScroll: true
        });
        
        this.totalItems = this.checklistItems.length;
    }

    checkTabCompletion() {
        const currentPageElement = document.querySelector('.page.active');
        const visibleCheckableItems = currentPageElement.querySelectorAll('.checklist-item');
        const checkedVisibleItems = [...visibleCheckableItems].filter(item => item.classList.contains('checked'));
        
        const totalVisible = visibleCheckableItems.length;
        const checkedCount = checkedVisibleItems.length;
        const isTabComplete = checkedCount === totalVisible && totalVisible > 0;
        
        const proceedElements = ['deployment-proceed', 'piloting-proceed'];
        if (this.currentPage < proceedElements.length) {
            const proceedElement = document.getElementById(proceedElements[this.currentPage]);
            if (proceedElement) {
                const wasHidden = proceedElement.style.display === 'none' || proceedElement.style.display === '';
                proceedElement.style.display = isTabComplete ? 'table-row' : 'none';
                
                if (isTabComplete && wasHidden) {
                    setTimeout(() => this.scrollIntoViewIfNeeded(proceedElement), 100);
                }
            }
        } else if (this.currentPage === 2) { 
            const completeElement = document.getElementById('monitoring-complete');
            if (completeElement) {
                const wasHidden = completeElement.style.display === 'none' || completeElement.style.display === '';
                completeElement.style.display = isTabComplete ? 'table-row' : 'none';
                
                if (isTabComplete && wasHidden) {
                    setTimeout(() => this.scrollIntoViewIfNeeded(completeElement), 100);
                }
            }
        }
        
        if (this.nextBtn) {
            if (isTabComplete && this.currentPage < this.totalPages - 1) {
                this.nextBtn.classList.add('highlighted');
            } else {
                this.nextBtn.classList.remove('highlighted');
            }
        }
    }

    updateFooter() {
        const checkedCount = document.querySelectorAll('.checklist-item.checked').length;
        const isComplete = checkedCount === this.totalItems;

        if (isComplete && this.currentPage === this.totalPages - 1) {
            this.pagerControls.style.display = 'none';
            this.nextChecklistBtn.style.display = 'block';
        } else {
            this.pagerControls.style.display = 'flex';
            this.nextChecklistBtn.style.display = 'none';
        }
    }

    checkOverallCompletion() {
        const checkedCount = document.querySelectorAll('.checklist-item.checked').length;
        
        if (checkedCount === this.totalItems) {
            this.progressText.textContent += ' -- CHECKLIST COMPLETE';
            this.progressText.style.color = 'var(--complete-color)';
        } else {
            this.progressText.style.color = 'var(--dim-text-color)';
        }
    }
}

class PostFlightChecklist extends ROVChecklistApp {
    constructor() {
        super({
            hasPages: true,
            hasSubTabs: true,
            hasQuestions: false,
            pageTitles: ['PILOTING', 'VEHICLE', 'TETHER', 'CONTROL STATION']
        });
        
        this.totalItems = this.checklistItems.length;
    }

    checkTabCompletion() {
        const currentPageElement = document.querySelector('.page.active');
        const visibleCheckableItems = currentPageElement.querySelectorAll('.checklist-item');
        const checkedVisibleItems = [...visibleCheckableItems].filter(item => item.classList.contains('checked'));
        
        const totalVisible = visibleCheckableItems.length;
        const checkedCount = checkedVisibleItems.length;
        const isTabComplete = checkedCount === totalVisible && totalVisible > 0;
        
        const proceedElements = ['piloting-proceed', 'vehicle-proceed', 'tether-proceed'];
        const proceedElement = document.getElementById(proceedElements[this.currentPage]);
        if (proceedElement) {
            proceedElement.style.display = isTabComplete ? 'table-row' : 'none';
        }
        
        if (this.nextBtn) {
            if (isTabComplete && this.currentPage < this.totalPages - 1) {
                this.nextBtn.classList.add('highlighted');
            } else {
                this.nextBtn.classList.remove('highlighted');
            }
        }
    }

    updateFooter() {
        const checkedCount = document.querySelectorAll('.checklist-item.checked').length;
        const isComplete = checkedCount === this.totalItems;

        if (isComplete && this.currentPage === this.totalPages - 1) {
            this.pagerControls.style.display = 'none';
            this.nextChecklistBtn.style.display = 'block';
        } else {
            this.pagerControls.style.display = 'flex';
            this.nextChecklistBtn.style.display = 'none';
        }
    }

    checkOverallCompletion() {
        const checkedCount = document.querySelectorAll('.checklist-item.checked').length;
        const completionMessage = document.getElementById('completion-message-row');
        
        if (checkedCount === this.totalItems) {
            this.progressText.textContent += ' -- CHECKLIST COMPLETE';
            this.progressText.style.color = 'var(--complete-color)';
            if (completionMessage) {
                completionMessage.style.display = 'table-row';
                setTimeout(() => this.scrollIntoViewIfNeeded(completionMessage), 100);
            }
        } else {
            this.progressText.style.color = 'var(--dim-text-color)';
            if (completionMessage) {
                completionMessage.style.display = 'none';
            }
        }
    }
}

class HomePageApp extends ROVChecklistApp {
    constructor() {
        super({
            hasPages: true,
            hasSubTabs: true,
            hasQuestions: false,
            useNativeScroll: false
        });
    }

    updateProgress() {
        // Home page doesn't need progress tracking, but we still need to update scroll state
        this.updateScrollState();
    }
    
    updateFooter() {
        // Home page footer logic - just update scroll state
        this.updateScrollState();
    }
}

class WelcomePageApp extends ROVChecklistApp {
    constructor() {
        super({
            hasPages: false,
            hasSubTabs: false,
            hasQuestions: false
        });
    }

    updateProgress() {
        // Welcome page doesn't need progress tracking
    }

    updateScrollState() {
        if (this.scrollUpBtn) this.scrollUpBtn.disabled = true;
        if (this.scrollDownBtn) this.scrollDownBtn.disabled = true;
    }
}

// Troubleshooting pages with questions
class TroubleshootingApp extends ROVChecklistApp {
    constructor(config = {}) {
        super({
            hasQuestions: true,
            ...config
        });
        
        this.scrollPosition = 0;
    }

    checkComple