/**
 * Allows the creation of interactive tours
 * 
 * Author: Felix Bole <felix.bole@yahoo.fr>
 * MIT license: http://opensource.org/licenses/MIT
 * GitHub : github.com/FelixBole/tour.js
 * How to use : Check Github README
 * v1.0.0
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
     */
    setOptions({disableScroll = true, spotlight = true, language = "en"} = {}) {
        this.options.disableScroll = disableScroll;
        this.options.spotlight = spotlight;
        this.options.language = language;
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

            this.setResizeEvent(true);

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

        this.makeStep();
    }

    /**
     * Attempts to move on to the next step of the tour
     */
    next() {
        this.step++;

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

        this.currentElement = document.getElementById(elementId);

        this.updatePopup();

        const coordinates = this.getPopupPos(this.currentElement);

        this.movePopup(coordinates);

        if(this.options.spotlight)
            this.spotlight.move(this.currentElement);

        if(this.options.disableScroll)
            this.toggleScroll(false);
    }

    /**
     * Ends the tour
     */
    endTour() {
        this.currentState = 2;
        this.popupElement.remove();
        this.setResizeEvent(false);
        
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
     * @param {DOMElement} element The target element
     * @returns {object} x and y coordinates
     */
    getPopupPos(element) {

        // Scroll first to get the right values of getBoundingClientRect
        element.scrollIntoView(this.getTopOrBottom(element));

        let docRect = document.body.getBoundingClientRect();
        let rect = element.getBoundingClientRect();

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
            } else {
                // LEFT
                pos.x = rect.left - offset - popupRect.width;
                pos.y = rect.top + (rect.height / 2) - (popupRect.height / 2);
            }
        }

        pos.x = Math.abs(pos.x);
        pos.y = Math.abs(pos.y);

        // Bound to window size
        pos.x = (pos.x > window.innerWidth - popupRect.width) ? pos.x - popupRect.width : pos.x;
        pos.y = (pos.y > window.innerHeight - popupRect.height) ? pos.y - popupRect.height : pos.y;

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

        // Format text
        let text = this.steps[this.step].text;
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

        let html = `
            <p>${text}</p>
            <div class="tour-button-container"> `;
        
        if(this.step != 0) {
            html += `<button class="tour-button tour-button--previous" onclick="${this.varName}.previous()">${prevText}</button>`;
        }

        html += `<button class="tour-button tour-button--next" onclick="${this.varName}.next()">${this.isLastStep() ? endText : nextText}</button>
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
        const popup = this.popupElement;
        popup.style.left = coordinates.x + "px";
        popup.style.top = coordinates.y + "px";
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
    setResizeEvent(shouldResize) {

        if(shouldResize) {
            let doit;
            window.onresize = () => {
                clearTimeout(doit);
                doit = setTimeout(() => {
                    // Haven't resized in 100ms
    
                    // Make current step to recalculate
                    this.makeStep();
                } ,100)
            };
        } else {
            window.onresize = () => {};
        }
    }
}