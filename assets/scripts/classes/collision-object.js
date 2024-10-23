export default class CollisionObject {
    constructor(element) {
        this.element = element;
        this.updateBounds();
    }

    /**
     * Updates position in global context for use with collisions
     * 
     * Only to be used during resize event and constructor to prevent constant refresh of the document
     */
    updateBounds() {
        const rect = this.element.getBoundingClientRect();
        this.top = rect.top;
        this.bottom = rect.bottom;
        this.left = rect.left;
        this.right = rect.right;
    }
}