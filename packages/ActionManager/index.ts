/**
 * author: huihui
 * 
 */
class ActionMnager {
    page: string;
    
    map = new Map();

    pageInstance: Map<string, object>;

    use (page: string) {
        if (this.map.has(page)) {
            this.pageInstance = this.map.get(this.page);
        }
        else {
            this.pageInstance = new Map();
        }
    }

    private enQueue () {
        
    }
}


class Action {

}

let Actionman = new ActionMnager();
Actionman.page = '123'


export default new ActionMnager();