sap.ui.define(["sap/base/Log"], function (Log) {
    "use strict";

    /**
     * Initialize listReport
     * @param {sap.ui.core.mvc.Controller} control ListReport controller
     * @constructor
     */
    function ListReport(control) {
        this.listReport = control;
    }

    /**
     * Function to avoid using hardcoded IDs, but rather go through aggregations, and pick a desired aggregation inside the ListReport
     * @param {string} path This is meant to be used as walking through aggregations,
     * we write the path of aggregations from ListReport downwards e.g:
     * `content.title._actionsToolbar`
     * In the future we should support specific item in array e.g: `content.0.title._actionsToolbar`
     * @return {sap.ui.core.Element} element
     */
    ListReport.prototype.getElementByPath = function (path) {
        function drillDown(control, drillTowards) {
            const [path, ...restOfPath] = drillTowards.split('.');

            if (path) {
                try {
                    if (restOfPath.length) {
                        let newControl = control.mAggregations[path];

                        if (Array.isArray(newControl) && newControl.length === 1) {
                            newControl = newControl[0];
                        } else {
                            Log.error('We are not supporting the multiple children at the moment');
                        }

                        return drillDown(newControl, restOfPath.join('.'));
                    } else {
                        return control.mAggregations[path];
                    }
                } catch (error) {
                    Log.error('Failed to get the path:' + path + ' for elementId:' + control.sId, error);
                }

            } else {
                Log.error('Path is needed for drilldown, but passed path:' + path);
            }

            return undefined;
        }

        return drillDown(this.listReport.getView(), path);
    };

    return ListReport;
});
