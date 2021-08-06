/**
 * Allows the creation of spotlight to put elements in evidence 
 * and move the spotlight around the DOM relative to the element
 * 
 * Author Felix Bole <felix.bole@yahoo.fr>
 */
class Spotlight {

    /**
     * 
     * @param {number} padding The padding for the spotlight (space around the element)
     */
    constructor(padding) {
        this.padding = padding;
        this.spotlight = [];

        this.createSpotlight();
    }

    /**
     * Creates the 4 blocks that will serve as spotlight
     */
    create() {
        for(let i = 0; i < 4; i++) {
            let o = document.createElement('div');
            o.classList.add("tour-overlay")
            document.body.appendChild(o);
            this.spotlight.push(o);
        }
    }
    
    /**
     * Moves the spotlight to the target element
     * @param {DOMElement} element The element to put into spotlight
     */
    move(element) {

        const rect = element.getBoundingClientRect();

        this.spotlight[0].style.top = (rect.top - this.padding - this.spotlight[0].getBoundingClientRect().height) + "px";

        this.spotlight[1].style.left = (rect.right + this.padding) + "px";
        this.spotlight[1].style.top = (rect.top - this.padding) + "px";

        this.spotlight[2].style.top = (rect.bottom + this.padding) + "px";

        this.spotlight[3].style.left = (rect.left - this.padding - this.spotlight[3].getBoundingClientRect().width) + "px";
        this.spotlight[3].style.top = (rect.top - this.padding) + "px";

        // Set size for the blocks to not overlay each other
        // Top/Bottom remain unchanged.

        this.spotlight[3].style.height = rect.height + (this.padding * 2) + "px";
        this.spotlight[1].style.height = rect.height + (this.padding * 2) + "px";
    }
    
    /**
     * Removes the spotlight from the DOM and resets array
     * @returns {null}
     */
    kill() {
        if(this.spotlight.length != 0) {
            this.spotlight.forEach(el => {
                el.remove();
            })
        }

        // this.spotlight = [];
        return null;
    }
}