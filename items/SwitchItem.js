import request from "request";

class SwitchItem {
    constructor(widget, platform, homebridge) {

        this.platform = platform;
        this.uuidAction = widget.uuidAction; //to control a switch, use the uuidAction
        this.stateUuid = widget.states.active; //a switch always has a state called active, which is the uuid which will receive the event to read
        this.currentState = undefined; //will be 0 or 1 for Switch

        SwitchItem.super_.call(this, widget,platform,homebridge);
    }

    // Register a listener to be notified of changes in this items value
    initListener() {
        this.platform.ws.registerListenerForUUID(this.stateUuid, this.callBack.bind(this));
    }

    callBack(value) {
        //function that gets called by the registered ws listener
        //console.log("Got new state for switch: " + value);
        this.currentState = value;

        //also make sure this change is directly communicated to HomeKit
        this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.On)
            .updateValue(this.currentState == '1');
    }

    getOtherServices() {
        const otherService = new this.homebridge.hap.Service.Switch();

        otherService.getCharacteristic(this.homebridge.hap.Characteristic.On)
            .on('set', this.setItemState.bind(this))
            .on('get', this.getItemState.bind(this))
            .updateValue(this.currentState == '1');

        return otherService;
    }

    getItemState(callback) {
        //returns true if currentState is 1
        callback(undefined, this.currentState == '1');
    }

    onCommand() {
        return (
            //function to set the command to be used for On
            //for a switch, this is 'On', but subclasses can override this to eg Pulse
            "On"
        );
    }

    setItemState(value, callback) {

        //sending new state to loxone
        //added some logic to prevent a loop when the change because of external event captured by callback

        const self = this;

        const command = (value == '1') ? this.onCommand() : 'Off';
        this.log(`[switch] iOS - send message to ${this.name}: ${command}`);
        this.platform.ws.sendCommand(this.uuidAction, command);
        callback();

    }
}

export default SwitchItem;