sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "../model/models",
    "../model/formatter",
    "sap/ui/model/json/JSONModel"
], (Controller, MessageToast, MessageBox, models, formatter, JSONModel) => {
    "use strict";

    return Controller.extend("vcpapp.vcpobpfioriapp.controller.View1", {
        formatter: formatter,
        onInit() {
            var oOptimizationModel = models.createOptimizationModel();
            this.getView().setModel(oOptimizationModel, "optimization");

            // Set upload model
            var oUploadModel = models.createUploadModel();
            this.getView().setModel(oUploadModel, "upload");
        },

        onExit: function () {
            // Clean up polling interval if exists
            if (this._pollingInterval) {
                clearInterval(this._pollingInterval);
            }
        },
        onDownloadSampleData: function () {
            const origin = window.location.origin;
            const contextPath = window.location.pathname.replace(/\/index\.html$/, '');
            const finalURL = `${origin}${contextPath}`;
            this._downloadFile("sample_data.xlsx", finalURL, {
                planningStartDate: "2025-05-29",
                minEarlyDeliveryDays: 7
            });
        },
        onDownloadResultsTemplate: async function () {
            const origin = window.location.origin;
            const contextPath = window.location.pathname.replace(/\/index\.html$/, '');
            const finalURL = `${origin}${contextPath}` + ("/api/planning/download-results");
            const filename = "optimization_results.xlsx"
            try {
                const response2 = await fetch(finalURL, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json"
                    },

                })
                if (!response2.ok) {
                    throw new Error(`Download failed: ${response.statusText}`);
                }

                const blob = await response2.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                MessageToast.show(this.getResourceBundle().getText("downloadSuccess", [filename]));
            }
            catch (err) {
                MessageBox.error(err.message || this.getResourceBundle().getText("downloadError", [filename]));
            }
        },
        _downloadFile: async function (filename, finalUrl, requestData) {
            MessageToast.show(this.getResourceBundle().getText("downloadingFile", [filename]));
            console.log("URL:", finalUrl);
            console.log("Request Data:", requestData);
            console.log("Request Data JSON:", JSON.stringify(requestData));
            sap.ui.core.BusyIndicator.show();
            try {
                var url2 = finalUrl + ('/api/planning/generate-sample')
                const response = await fetch(url2, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(requestData)
                })

                if (!response.ok) {
                    const errText = await response.text();
                    console.error("🛑 fetch response body:", errText);
                    sap.ui.core.BusyIndicator.hide();
                    return MessageBox.error(this.getResourceBundle().getText("downloadError", [filename]));
                }
                var finalsampleURL = finalUrl + ("/api/planning/download-sample");
                const response1 = await fetch(finalsampleURL, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json"
                    }
                })
                if (!response1.ok) {
                    throw new Error(`Download failed: ${response.statusText}`);
                }

                const blob = await response1.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                MessageToast.show(this.getResourceBundle().getText("downloadSuccess", [filename]));
                sap.ui.core.BusyIndicator.hide();
            } catch (err) {
                MessageBox.error(err.message || this.getResourceBundle().getText("downloadError", [filename]));
            } finally {
                sap.ui.core.BusyIndicator.hide();
            }

        },
        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },
        onFileChange: function (oEvent) {
            var aFiles = oEvent.getParameter("files");
            if (aFiles && aFiles.length > 0) {
                var sFileName = aFiles[0].name;
                MessageToast.show(this.getResourceBundle().getText("fileSelected", [sFileName]));
            }
        },
        onUploadPress: function () {
            var oFileUploader = this.byId("fileUploader");

            if (!oFileUploader.getValue()) {
                MessageToast.show(this.getResourceBundle().getText("selectFileFirst"));
                return;
            }

            // Reset upload model
            var oUploadModel = this.getView().getModel("upload");
            oUploadModel.setProperty("/uploadProgress", 0);
            oUploadModel.setProperty("/uploadStatus", this.getResourceBundle().getText("uploadingFile"));
            oUploadModel.setProperty("/uploadStatusType", "Information");
            //set upload URL
            const origin = window.location.origin;
            const contextPath = window.location.pathname.replace(/\/index\.html$/, '');
            const finalURL = `${origin}${contextPath}` + ("/api/planning/upload");
            oFileUploader.setUploadUrl(finalURL)
            // Add header parameter for CSRF token if needed
            var oHeaderParameter = new sap.ui.unified.FileUploaderParameter({
                name: "Accept",
                value: "application/json"
            });
            oFileUploader.addHeaderParameter(oHeaderParameter);

            // Start upload
            oFileUploader.upload();

            // Simulate progress (since we don't have real progress events)
            this._simulateUploadProgress();
        },
        _simulateUploadProgress: function () {
            var oUploadModel = this.getView().getModel("upload");
            var iProgress = 0;

            var fnUpdateProgress = function () {
                iProgress += 10;
                if (iProgress <= 90) {
                    oUploadModel.setProperty("/uploadProgress", iProgress);
                    setTimeout(fnUpdateProgress, 200);
                }
            };

            fnUpdateProgress();
        },
        onUploadComplete: function (oEvent) {
            var oUploadModel = this.getView().getModel("upload");
            var iStatus = oEvent.getParameters("status").response;
            var match = iStatus.match(/<pre>(.*?)<\/pre>/s);
            oUploadModel.setProperty("/uploadProgress", 100);
            match = JSON.parse(match[1]);
            if (match && match.success == true) {
                oUploadModel.setProperty("/uploadStatus", this.getResourceBundle().getText("uploadSuccess"));
                oUploadModel.setProperty("/uploadStatusType", "Success");
                MessageToast.show(this.getResourceBundle().getText("uploadSuccess"));
                oUploadModel.setProperty("/planningSystemData", match.summary.planningSystem)
                // Clear file uploader
                this.byId("fileUploader").clear();
            } else {
                oUploadModel.setProperty("/uploadStatus", this.getResourceBundle().getText("uploadError"));
                oUploadModel.setProperty("/uploadStatusType", "Error");
                MessageBox.error(this.getResourceBundle().getText("uploadError"));
            }

            // Reset progress after 2 seconds
            setTimeout(function () {
                oUploadModel.setProperty("/uploadProgress", 0);
            }, 2000);
        },

        onStartOptimization: async function () {
            this.byId("_IDGenButton1").setVisible(false);
            this._currentJobId = null;
            var oOptimizationModel = this.getView().getModel("optimization");
            var oData = oOptimizationModel.getData();
            var oUploadModel = this.getView().getModel("upload");
            var oConfig = {
                planningSystem: oUploadModel.getProperty("/planningSystemData") || {},
                populationSize: parseInt(oData.populationSize),
                generations: parseInt(oData.generations),
                mutationRate: parseFloat(oData.mutationRate),
                method: oData.method
            };

            MessageToast.show(this.getResourceBundle().getText("startingOptimization"));
            oOptimizationModel.setProperty("/isRunning", true);
            try {
                var url1 = window.location.href;
                url1 = url1.replace(/\/index\.html$/, '');
                var finalURL = url1 + ("/api/planning/optimize");
                const responseOptimiz = await fetch(finalURL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(oConfig)
                });

                if (!responseOptimiz.ok) {
                    const errorData = await responseOptimiz.json();
                    sap.ui.core.BusyIndicator.hide();
                    return MessageBox.error(errorData.message || "Optimization failed to start");
                }
                const result = await responseOptimiz.json();
                if (result.success) {
                    this._currentJobId = result.jobId;
                    this.pollOptimizationResults(this._currentJobId);
                }
                // Direct results returned
                // MessageBox.show(result.message);
                // this.resetOptimizationUI();
            } catch (error) {
                MessageBox.show(`Optimization failed: ${error.message}`, 'error');
                this.resetOptimizationUI();
                this.byId("_IDGenButton1").setVisible(true);
            }
        },
        resetOptimizationUI: function () {
            var oOptimizationModel = this.getView().getModel("optimization");
            oOptimizationModel.setProperty("/isRunning", false);
            this._optimizationId = null;

            if (this._pollingInterval) {
                clearInterval(this._pollingInterval);
                this._pollingInterval = null;
            }
        },
        // onStopOptimization: async function () {
        //     try {
        //         var url1 = window.location.href;
        //         url1 = url1.replace(/\/index\.html$/, '');
        //         var finalURL = url1 + ("/api/optimization/cancel");
        //         const responseOptimizeCancel = await fetch(finalURL, {
        //             method: 'POST',
        //             headers: {
        //                 'Content-Type': 'application/json'
        //             },
        //         });

        //         if (!responseOptimizeCancel.ok) {
        //             const errorData = await responseOptimizeCancel.json();
        //             sap.ui.core.BusyIndicator.hide();
        //             return MessageBox.error(errorData.message || "Error cancelling optimization");
        //         }
        //         const result = await responseOptimizeCancel.json();
        //         // Direct results returned
        //         MessageBox.show('Optimization cancelled successfully', 'success');
        //         this.resetOptimizationUI();
        //     } catch (error) {
        //         MessageBox.show(`Optimization cancellation failed: ${error.message}`, 'error');
        //         this.resetOptimizationUI();
        //     }
        // },
        pollOptimizationResults: function (jobId) {
            const oOptimizationModel = this.getView().getModel("optimization");
            const url1 = window.location.href.replace(/\/index\.html$/, '');
            const finalURL = `${url1}/api/planning/optimize/status/${jobId}`;
            const that = this;

            this._pollingInterval = setInterval(async () => {
                try {
                    const response = await fetch(finalURL);
                    const data = await response.json();
                    if (data.status === 'running') {
                        oOptimizationModel.setProperty("/isRunning", true);
                    } else if (data.status === 'completed') {
                        console.log('✅ Optimization completed:', data.result);
                        MessageToast.show("Optimization completed successfully", 'success');
                        oOptimizationModel.setProperty("/isRunning", false);
                        clearInterval(that._pollingInterval);
                        that.resetOptimizationUI();
                        this.byId("_IDGenButton1").setVisible(true);
                    } else if (data.status === 'cancelled' || data.status === 'error') {
                        if (data.error && data.error.includes('cancelled')) {
                            MessageToast.show('Optimization was cancelled', 'info');
                        } else {
                            MessageToast.show(`Optimization failed: ${data.error}`, 'error');
                        }
                        oOptimizationModel.setProperty("/isRunning", false);
                        clearInterval(that._pollingInterval);
                        that.resetOptimizationUI();
                        this.byId("_IDGenButton1").setVisible(true);
                    }

                    // if (data.status === 'completed') {
                    //     clearInterval(that._pollingInterval);
                    //     oOptimizationModel.setProperty("/isRunning", false);
                    //     MessageToast.show("Optimization completed");

                    //     // Download or handle results
                    //     if (data.downloadUrl) {
                    //         window.open(data.downloadUrl, '_blank'); // or trigger download
                    //     }

                    //     // Optionally show summary, fitness, etc.
                    //     console.log("Optimization Results", data.results);
                    // } else if (data.status === 'error') {
                    //     clearInterval(that._pollingInterval);
                    //     oOptimizationModel.setProperty("/isRunning", false);
                    //     MessageBox.error(`Optimization failed: ${data.error}`);
                    // }
                } catch (err) {
                    clearInterval(that._pollingInterval);
                    oOptimizationModel.setProperty("/isRunning", false);
                    MessageBox.error(`Polling failed: ${err.message}`);
                    this.byId("_IDGenButton1").setVisible(true);
                }
            }, 5000); // Poll every 5 seconds
        },
        onStopOptimization: async function () {
            if (this._currentJobId) {
                const fullJobId = this._currentJobId;
                const that = this;
                const origin = window.location.origin;
                const contextPath = window.location.pathname.replace(/\/index\.html$/, '');
                const finalURL = `${origin}${contextPath}` + (`/api/planning/optimize/stop`);
                // await fetch(finalURL, {
                //     method: 'POST'
                // });
                try {
                const response = await fetch(finalURL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fullJobId})
                });
                if (response.ok) {
                    MessageToast.show('Cancellation request sent', 'info');
                } else {
                    MessageBox.show('Failed to cancel optimization', 'error');
                }
                MessageToast.show("Cancellation requested.");
            } catch (error) {
                showStatus(`Failed to stop optimization: ${error.message}`, 'error');
                that.resetOptimizationUI();
            }
                // clearInterval(this._pollingInterval);
                
            }
            else{
                this.byId("_IDGenButton1").setVisible(true);
                MessageToast.show("No optimization found");
            }
        }
    });
});