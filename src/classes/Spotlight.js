/**
 * Creates a spotlight to target specific elements in the dom 
 * and move the spotlight around the DOM relative to the element
 * 
 * Author: Felix Bole <felix.bole@yahoo.fr>
 * MIT license: http://opensource.org/licenses/MIT
 * GitHub : github.com/FelixBole/tour.js
 * How to use : Check Github README
 * v1.1.0
 * 
 */
 class Spotlight {

    /**
     * 
     * @param {number} padding The padding for the spotlight (space around the element)
     */
    constructor(padding = 0) {
        this.padding = padding;
        this.spotlight = [];

        this.create();
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
     * @param {HTMLElement} element The element to put into spotlight
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
     * Fills the viewport with black squares
     */
    blackout() {
        this.spotlight[0].style.top = "0px";
        this.spotlight[1].style.left = this.spotlight[1].getBoundingClientRect().width + "px";
        this.spotlight[2].style.top = this.spotlight[2].getBoundingClientRect().height + "px";
        this.spotlight[3].style.left = "-" + this.spotlight[3].getBoundingClientRect().width + "px";
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
        
        return null;
    }
}