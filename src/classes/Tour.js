/**
 * Allows the creation of interactive tours
 * 
 * Author: Felix Bole <felix.bole@yahoo.fr>
 * MIT license: http://opensource.org/licenses/MIT
 * GitHub : github.com/FelixBole/tour.js
 * How to use : Check Github README
 * v1.1.0
 * 
 */
 class Tour {
    /**
     * @param {string} varName The name of the variable for the instance
     * @param {array} steps Array of objects with element ID & text for each step
     * @param {number} step The current step of the tour
     */
    constructor(varName, steps, step = 0) {
        this.varName = varName;
        this.steps = steps;
        this.step = step;

        this.currentState = 0;

        /**
         * @type HTMLElement
         */
        this.currentElement = null;
        /**
         * @type HTMLElement
         */

        this.popupElement = null;

        /**
         * @type Spotlight
         */
        this.spotlight = null;

        this.textVariables = {};
        this.options = {};

        this.setOptions();

        this.createResizeObserver();
    }

    /**
     * Gets the saved tour from session storage
     * @param {string} varName The name of the variable for the new instance
     * @returns {Tour} The saved tour from sessionStorage
     */
    static getSavedTour(varName) {
        let tour = sessionStorage.getItem('tour');
        tour = JSON.parse(tour);

        let newTour = new Tour(varName, tour.steps, parseInt(tour.step));
        
        newTour.spotlight = tour.spotlight;
        newTour.setTextVariables(tour.textVariables);
        newTour.setOptions(tour.options);

        return newTour;
    }

    /**
     * Set the variables that will be replaced in text. Your text must contain placeholders such as
     * PLACEHOLDER-VARIABLENAME will be replaced into the value you specify
     * @param {object} variables an object containing variables and their value to be replaced with
     */
    setTextVariables(variables) {
        this.textVariables = variables;
    }

    /**
     * Set options to override the tour
     * @param {object} options Options to set
     * @param {boolean} options.disableScroll If the scroll should be disabled when the popup shows
     * @param {boolean} options.spotlight If the tour should contain a spotlight
     * @param {string} options.language (en or fr) sets the default language for the buttons on the help popup
     * @param {number} options.scrollMargin The margin when scrolling to that element
     */
    setOptions({disableScroll = true, spotlight = true, language = "en", scrollMargin = 50} = {}) {
        this.options.disableScroll = disableScroll;
        this.options.spotlight = spotlight;
        this.options.language = language;
        this.options.scrollMargin = scrollMargin;
    }

    /**
     * Saves the step in session storage to persist data in page changes
     */
    save() {
        let tour = {
            currentState: this.currentState.toString(),
            steps: this.steps,
            step: this.step.toString(),
            styles: this.styles,
            options: this.options,
            textVariables: this.textVariables,
        };

        sessionStorage.setItem("Tour.js", JSON.stringify(tour));
    }

    /**
     * Start the tour
     */
    start() {
        if(this.currentState != 1) {
            this.currentState = 1;

            this.setWindowResizeEvent(true);

            this.createPopup();

            if(this.options.spotlight)
                this.spotlight = new Spotlight(10);

            this.makeStep();
        } else {
            console.warn("The Tour has already started.");
        }
    }

    /**
     * Attemps to run previous step
     */
    previous() {
        this.step--;

        if(this.currentElement)
            this.toggleResizeObserver(false);

        this.makeStep();
    }

    /**
     * Attempts to move on to the next step of the tour
     */
    next() {
        this.step++;

        if(this.currentElement)
            this.toggleResizeObserver(false);

        if(this.step < this.steps.length) {
            this.makeStep();
        } else {
            this.endTour();
        }
    }

    /**
     * Makes a specific step of the tour using current step
     */
    makeStep() {
        const elementId = this.steps[this.step].id;

        this.updatePopup();

        let coordinates;
        
        if(elementId) {
            this.currentElement = document.getElementById(elementId);
            this.toggleResizeObserver(true); //! This makes it that makeStep is fired twice -> To improve

            coordinates = this.getPopupPos();
        } else {
            // No id specified, place popup in the middle
            this.currentElement = null;
            coordinates = this.getCenterPos();
        }

        this.movePopup(coordinates);

        if(this.options.spotlight) {
            if(this.currentElement) {
                this.spotlight.move(this.currentElement);
            } else {
                // this.spotlight.move(this.popupElement);
                this.spotlight.blackout();
            }
        }

        if(this.options.disableScroll)
            this.toggleScroll(false);

        if(elementId)
            this.currentElement.scrollMarginTop = "0px";
    }

    /**
     * Ends the tour
     */
    endTour() {
        this.currentState = 2;
        this.popupElement.remove();
        this.setWindowResizeEvent(false);
        
        if(this.options.spotlight)
            this.spotlight.kill();

        this.toggleScroll(true);
    }

    /**
     * Returns a boolean to know if the current step is the last step
     * @returns {boolean} If it is the last step of the tour
     */
    isLastStep() {
        return this.step == this.steps.length - 1;
    }

    /**
     * Returns the document coordinates where the block should be created
     * @returns {object} x and y coordinates
     */
    getPopupPos() {

        // Scroll first to get the right values of getBoundingClientRect
        this.currentElement.style.scrollMarginTop = this.options.scrollMargin + "px";

        const scrollTop = this.getTopOrBottom(this.currentElement);
        this.currentElement.scrollIntoView(scrollTop);

        const docRect = document.body.getBoundingClientRect();
        const rect = this.currentElement.getBoundingClientRect();
        const popupRect = this.popupElement.getBoundingClientRect();
        
        const offset = 10;
        let pos = {x: 0, y: 0}

        // If the width of the element is too large, create above or under
        if(docRect.width - rect.width <= docRect.width / 2) {

            if(rect.bottom < window.innerHeight / 2) {
                // BOTTOM
                pos.x = rect.left + (rect.width / 2) - (popupRect.width / 2);
                pos.y = rect.bottom + offset;
            } else {
                // TOP
                pos.x = rect.left + (rect.width / 2) - (popupRect.width / 2);
                pos.y = rect.top - offset - popupRect.height; 
            }
        } else {
            // Define if left or right
            if(rect.right < docRect.width / 2) {
                // RIGHT
                pos.x = rect.right + offset;
                pos.y = rect.top + (rect.height / 2) - (popupRect.height / 2);

                // If popup too large for element, place under and re-scrollIntoView
                if(docRect.width - popupRect.width < rect.right) {
                    this.currentElement.scrollIntoView(true);
                    pos.x = rect.left + (rect.width / 2) - (popupRect.width / 2);
                    pos.y = rect.bottom + offset;
                }

            } else {
                // LEFT
                pos.x = (rect.left - offset - popupRect.width) < 0 ? 0 : (rect.left - offset - popupRect.width);
                pos.y = rect.top + (rect.height / 2) - (popupRect.height / 2);

                // If popup too large for element, place under and re-scrollIntoView
                if(popupRect.width > rect.left) {
                    this.currentElement.scrollIntoView(true);
                    pos.x = rect.left + (rect.width / 2) - (popupRect.width / 2);
                    pos.y = rect.bottom + offset;
                }
            }
        }

        pos.x = Math.abs(pos.x);
        pos.y = Math.abs(pos.y);

        return pos;
    }

    /**
     * Returns center of the viewport x and y coordinates
     * @returns {object} x/y coordinates
     */
    getCenterPos() {
        const popupRect = this.popupElement.getBoundingClientRect();
        const pos = {x: 0, y: 0};

        pos.x = (window.innerWidth / 2) - (popupRect.width / 2);
        pos.y = (window.innerHeight / 2) - (popupRect.height / 2);

        return pos;
    }

    /**
     * Returns if the element is on the top or bottom of the page
     * @param {HTMLElement} element The element frow which to get the position
     * @returns {boolean} true if element is on top, false if on bottom
     */
    getTopOrBottom(element) {
        const docH = document.body.offsetHeight;
        
        return element.offsetTop < docH / 2 ? true : false;
    }

    /**
     * Creates the help popup
     */
    createPopup() {
        const popup = document.createElement('div');
        popup.classList.add("tour-popup-container");
        document.body.append(popup);
        this.popupElement = popup;
    }

    /**
     * Updates the help popup content for the current step
     */
    updatePopup() {
        const popup = this.popupElement;

        const step = this.steps[this.step];

        // Format text
        let text = step.text;
        for(let variable in this.textVariables) {
            text = text.replace("PLACEHOLDER-" + variable, this.textVariables[variable]);
        }

        let prevText = "Previous";
        let nextText = "Next";
        let endText = "End tour";

        if(this.options.language) {
            const lang = this.options.language;

            switch (lang) {
                case "fr":
                    prevText = "Retour";
                    nextText = "Suivant";
                    endText = "Terminer le tour";
                    break

                default:
                    break;
            }
        }

        let html = "";

        if(step.img && step.img != "") {
            html += `<img src="${step.img}"/>`
        }

        html += `
            <p>${text}</p>
            <div class="tour-button-container"> `;

        if(this.step != 0) {
            html += `
                <button class="tour-button tour-button--previous" onclick="${this.varName}.previous()">
                    ${prevText}
                </button>`;
        }

        html += `<button class="tour-button tour-button--next" onclick="${this.varName}.next()">
                    ${this.isLastStep() ? endText : nextText}
                </button>
            </div>
        `;

        popup.innerHTML = html;

        // Re-assign to be able to get DOMRect with content inside.
        this.popupElement = popup;
    }

    /**
     * Moves the popup to the coordinates
     * @param {object} coordinates x/y coordinates
     */
    movePopup(coordinates) {
        this.popupElement.style.left = coordinates.x + "px";
        this.popupElement.style.top = coordinates.y + "px";
    }

    /**
     * Toggles the ability to scroll
     * @param {boolean} canScroll Set canScroll
     */
    toggleScroll(canScroll) {

        const scrollX = window.pagexOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;

        if(canScroll) {
            window.onscroll = () => {};
        } else {
            window.onscroll = () => {
                window.scrollTo(scrollX, scrollY);
            };
        }
    }

    /**
     * Recalculate on window resize
     * @param {boolean} shouldResize if resizing the window should recalculate position.
     */
    setWindowResizeEvent(shouldResize) {

        if(shouldResize) {
            let doit;
            window.onresize = () => {
                clearTimeout(doit);
                doit = setTimeout(() => {
                    // Haven't resized in 100ms
    
                    // Make current step to recalculate
                    this.makeStep();
                }, 100);
            };
        } else {
            window.onresize = () => {};
        }
    }

    /**
     * Create a ResizeOberver for the current element
     */
    createResizeObserver() {
        let doit;
        this.resizeObserver = new ResizeObserver((entries) => {
            clearTimeout(doit);
            doit = setTimeout(() => {
                // Haven't resized in 20ms
                this.makeStep(entries[0]);
            }, 20);
        });
    }

    /**
     * If targetting an element that can expand, allows the spotlight to follow
     * @param {boolean} shouldResize if resizing the element should call the event
     */
    toggleResizeObserver(shouldResize) {
        if(shouldResize) {
            this.resizeObserver.observe(this.currentElement);
        } else {
            this.resizeObserver.unobserve(this.currentElement);
        }
    }
}