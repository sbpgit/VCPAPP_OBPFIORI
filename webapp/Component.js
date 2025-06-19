sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "vcpapp/vcpobpfioriapp/model/models"
], (UIComponent,Device, models) => {
    "use strict";

    return UIComponent.extend("vcpapp.vcpobpfioriapp.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // enable routing
            this.getRouter().initialize();

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

             // set the device model
             this.setModel(models.createDeviceModel(), "device");
            
             // set the FLP model
             this.setModel(models.createFLPModel(), "FLP");

            // create the views based on the url/hash
            this.getRouter().initialize();
        },
        /**
              * The component is destroyed by UI5 automatically.
              * @public
              * @override
              */
        destroy: function () {
            // call the base component's destroy function
            UIComponent.prototype.destroy.apply(this, arguments);
        },

        /**
         * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
         * design mode class should be set, which influences the size appearance of some controls.
         * @public
         * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
         */
        getContentDensityClass: function () {
            if (this._sContentDensityClass === undefined) {
                // check whether FLP has already set the content density class; do nothing in this case
                if (document.body.classList.contains("sapUiSizeCozy") || document.body.classList.contains("sapUiSizeCompact")) {
                    this._sContentDensityClass = "";
                } else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
                    this._sContentDensityClass = "sapUiSizeCompact";
                } else {
                    // "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
                    this._sContentDensityClass = "sapUiSizeCozy";
                }
            }
            return this._sContentDensityClass;
        }
    });
});