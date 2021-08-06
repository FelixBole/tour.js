/**
 * Allows the creation of interactive tours
 * 
 * Author: Felix Bole <felix.bole@yahoo.fr>
 */
class Tour {

    states = {
        0: "configuration",
        1: "started",
        2: "finished",
    };

    /**
     * Current target element
     * @type DOMElement
     */
    currentElement;

    /**
     * @type DOMelement
     */
    helpBubbleElement;

    /**
     * The current Tour state index
     * @type number
     */
    currentState;

    /**
     * Array containing the 4 blocks. Indexes match with position clockwise: 0: top ... 3: left
     * @type array
     */
    spotlight = [];

    /**
     * Object containing the different variables to replace in text
     * @type object
     */
    textVariables = {}

    /**
     * Options for the Tour, default are set in class
     * @type object
     */
    options = {
        disableScroll: true,
        spotlight: true,
    }

    /**
     * @param {string} varName The name of the variable for the instance
     * @param {string} userName The user's name
     * @param {number} stars The amount of VisionsStars the user has
     * @param {array} steps Array of objeects with element ID & text for each step
     * @param {number} step The current step of the tour
     */
    constructor(varName, steps, step = 0) {
        this.varName = varName;
        this.steps = steps;
        this.step = step;

        this.currentState = 0;
    }

    /**
     * Gets the saved tour from session storage
     * @param {string} varName The name of the variable for the new instance
     * @returns {Tour} The saved tour from sessionStorage
     */
    static getTourAndStep(varName) {
        let tour = sessionStorage.getItem('tour');
        tour = JSON.parse(tour);

        let newTour = new Tour(varName, tour.userName, parseInt(tour.stars), tour.steps, parseInt(tour.step))

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
     * @defaults 
     *  disableScroll: true
     *  spotlight: true
     */
    setOptions({disableScroll = true, spotlight = true} = {}) {
        this.options.disableScroll = disableScroll;
        this.options.spotlight = spotlight;
    }

    /**
     * Saves the step in session storage to persist data in page changes
     */
    saveStep() {
        let tour = {
            userName: this.userName,
            currentState: this.currentState.toString(),
            stars: this.stars.toString(),
            steps: this.steps,
            step: this.step.toString(),
            styles: this.styles,
            options: this.options,
        };

        sessionStorage.setItem("tour", JSON.stringify(tour));
    }

    /**
     * Start the tour
     */
    start() {
        if(this.currentState != 1) {
            this.currentState = 1;

            this.setResizeEvent(true);

            this.createBubble();

            if(this.options.spotlight)
                this.createSpotlight();

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

        this.updateBubble();

        const coordinates = this.getHelpBubblePos(this.currentElement);

        this.moveBubble(coordinates);

        if(this.options.spotlight)
            this.moveSpotlight();

        if(this.options.disableScroll)
            this.toggleScroll(false);
    }

    /**
     * Ends the tour
     */
    endTour() {
        console.log("Tour finished");
        this.currentState = 2;
        this.helpBubbleElement.remove();
        this.setResizeEvent(false);
        
        if(this.options.spotlight)
            this.killSpotlight();

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
    getHelpBubblePos(element) {

        // Scroll first to get the right values of getBoundingClientRect
        element.scrollIntoView(this.getTopOrBottom(element));

        let docRect = document.body.getBoundingClientRect();
        let rect = element.getBoundingClientRect();

        const bubbleRect = this.helpBubbleElement.getBoundingClientRect();
        
        const offset = 10;
        let pos = {x: 0, y: 0}

        // If the width of the element is too large, create above or under
        if(docRect.width - rect.width <= docRect.width / 2) {
            // if(rect.bottom < docRect.height / 2) {

            console.log(`rect.bottom : ${rect.bottom} -- w : ${window.innerHeight}`);

            if(rect.bottom < window.innerHeight / 2) {
                // BOTTOM
                console.log("IS TOP => GO BOTTOM");
                pos.x = rect.left + (rect.width / 2) - (bubbleRect.width / 2);
                pos.y = rect.bottom + offset;
            } else {
                // TOP
                console.log("IS BOTTOM => GO TOP");
                pos.x = rect.left + (rect.width / 2) - (bubbleRect.width / 2);
                pos.y = rect.top - offset - bubbleRect.height; 
            }
        } else {
            // Define if left or right
            if(rect.right < docRect.width / 2) {
                // RIGHT
                console.log("IS LEFT => GO RIGHT");
                pos.x = rect.right + offset;
                pos.y = rect.top + (rect.height / 2) - (bubbleRect.height / 2);
            } else {
                // LEFT
                console.log("IS RIGHT => GO LEFT");
                pos.x = rect.left - offset - bubbleRect.width;
                pos.y = rect.top + (rect.height / 2) - (bubbleRect.height / 2);
            }
        }

        pos.x = Math.abs(pos.x);
        pos.y = Math.abs(pos.y);

        // Bound to window size
        pos.x = pos.x > window.innerWidth ? pos.x - bubbleRect.width : pos.x;
        pos.y = pos.y > window.innerHeight ? pos.y - bubbleRect.height : pos.y;

        return pos;
    }

    /**
     * Returns if the element is on the top or bottom of the page
     * @param {DOMElement} element The element frow which to get the position
     * @returns {boolean} true if element is on top, false if on bottom
     */
    getTopOrBottom(element) {
        const docH = document.body.offsetHeight;
        
        return element.offsetTop < docH / 2 ? true : false;
    }

    /**
     * Initializes the bubble
     */
    createBubble() {
        const bubble = document.createElement('div');
        bubble.classList.add("tour-bubble-container");
        document.body.append(bubble);
        this.helpBubbleElement = bubble;
    }

    /**
     * Updates the help bubble content for the current step
     */
    updateBubble() {
        const bubble = this.helpBubbleElement;

        // Format text
        let text = this.steps[this.step].text;
        for(let variable in this.textVariables) {
            text = text.replace("PLACEHOLDER-" + variable, this.textVariables[variable]);
        }

        let html = `
            <p>${text}</p>
            <div class="tour-button-container"> `;
        
        if(this.step != 0) {

            html += `<button class="tour-button tour-button--previous" onclick="${this.varName}.previous()">Retour</button>`;
        }

        html += `<button class="tour-button tour-button--next" onclick="${this.varName}.next()">Suivant</button>
            </div>
        `;

        bubble.innerHTML = html;

        // Re-assign to be able to get DOMRect with content inside.
        this.helpBubbleElement = bubble;
    }

    /**
     * Moves the bubble to the coordinates
     * @param {object} coordinates x/y coordinates
     */
    moveBubble(coordinates) {
        const bubble = this.helpBubbleElement;
        bubble.style.left = coordinates.x + "px";
        bubble.style.top = coordinates.y + "px";
    }

    /**
     * Creates the 4 blocks that will serve as spotlight
     */
    createSpotlight() {
        for(let i = 0; i < 4; i++) {
            let o = document.createElement('div');
            o.classList.add("tour-overlay")
            document.body.appendChild(o);
            this.spotlight.push(o);
        }
    }

    /**
     * Moves the spotlight to the target element
     */
    moveSpotlight() {

        if(this.spotlight.length == 0)
            return console.error("Empty spotlights");

        const rect = this.currentElement.getBoundingClientRect();
        const offset = 5;

        this.spotlight[0].style.top = (rect.top - offset - this.spotlight[0].getBoundingClientRect().height) + "px";

        this.spotlight[1].style.left = (rect.right + offset) + "px";
        this.spotlight[1].style.top = (rect.top - offset) + "px";

        this.spotlight[2].style.top = (rect.bottom + offset) + "px";

        this.spotlight[3].style.left = (rect.left - offset - this.spotlight[3].getBoundingClientRect().width) + "px";
        this.spotlight[3].style.top = (rect.top - offset) + "px";

        // Set size for the blocks to not overlay each other
        // Top/Bottom remain unchanged.

        this.spotlight[3].style.height = rect.height + (offset * 2) + "px";
        this.spotlight[1].style.height = rect.height + (offset * 2) + "px";
    }

    /**
     * Removes the spotlight from the DOM and resets array
     */
    killSpotlight() {
        if(this.spotlight.length != 0) {
            this.spotlight.forEach(el => {
                el.remove();
            })
        }

        this.spotlight = [];
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