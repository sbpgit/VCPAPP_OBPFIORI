sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], function (JSONModel, Device) {
    "use strict";

    return {
        createDeviceModel: function () {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },

        createFLPModel: function () {
            // Simplified FLP model for standalone deployment
            // Check if running in FLP context
            var bIsShareInJamActive = false;
            try {
                if (sap && sap.ushell && sap.ushell.Container) {
                    var fnGetuser = sap.ushell.Container.getUser;
                    bIsShareInJamActive = fnGetuser ? fnGetuser().isJamActive() : false;
                }
            } catch (e) {
                // Not in FLP context, use defaults
            }
            
            var oModel = new JSONModel({
                isShareInJamActive: bIsShareInJamActive
            });
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },

        createOptimizationModel: function() {
            return new JSONModel({
                populationSize: 100,
                generations: 100,
                mutationRate: 0.1,
                method: "genetic",
                isRunning: false,
                results: {
                    bestFitness: null,
                    totalCost: null,
                    efficiency: null,
                    runtime: null
                }
            });
        },

        createUploadModel: function() {
            return new JSONModel({
                uploadProgress: 0,
                uploadStatus: "",
                uploadStatusType: "None"
            });
        }
    };
});