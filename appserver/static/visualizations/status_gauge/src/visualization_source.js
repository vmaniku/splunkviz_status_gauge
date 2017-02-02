/*
 * Splunk custom visualization for Status Gauge D3 implmentation
 */
define([
            'jquery',
            'underscore',
            'vizapi/SplunkVisualizationBase',
            'vizapi/SplunkVisualizationUtils',
            'd3'
            // Add required assets to this list
        ],
        function(
            $,
            _,
            SplunkVisualizationBase,
            SplunkVisualizationUtils,
            d3
        ) {

    // Extend from SplunkVisualizationBase
    return SplunkVisualizationBase.extend({

        initialize: function() {
            // SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
            this.$el = $(this.el);

            // this.$el.append('<h3>This is a custom visualization stand in.</h3>');
            // this.$el.append('<p>Edit your custom visualization app to render something here.</p>');

            // Add a css selector class
            this.$el.addClass('vm-status-gauge');

            // Initialization logic goes here
        },


        // Implement updateView to render a visualization.
        //  'data' will be the data object returned from formatData or from the search
        //  'config' will be the configuration property object
        updateView: function(data, config) {

            var arc, arcEndRad, arcStartRad, gauge, chartInset,
            degToRad, el, svg, endPadRad, i, margin, needle, padRad,
            percToDeg, percToRad, percent, radius, ref, sectionIndx, sectionPerc, startPadRad, totalPercent,
            textPositionY, textPositionX;


            // Set height and width
            var height = config['display.visualizations.custom.vmviz_status_gauge.status_gauge.height'] || 220;
            var width = config['display.visualizations.custom.vmviz_status_gauge.status_gauge.width'] || 220;

            // The gauge minimum value.
            var minValue = config['display.visualizations.custom.vmviz_status_gauge.status_gauge.minValue'] || 0;
            // The outer circle thickness as a percentage of it's radius.
            var barWidth = config['display.visualizations.custom.vmviz_status_gauge.status_gauge.barWidth'] || 30;

            // The size of the gap between the outer circle and wave circle as a percentage of the outer circles radius.
            var circleFillGap = config['display.visualizations.custom.vmviz_status_gauge.status_gauge.circleFillGap'] || 0.05;
            // The color of the outer circle.
            var circleColor = config['display.visualizations.custom.vmviz_status_gauge.status_gauge.circleColor'] || "#178BCA";
            var numSections = config['display.visualizations.custom.vmviz_status_gauge.status_gauge.numSections'] || 3;
            // The amount of time in milliseconds for the wave to rise from 0 to it's final height.
            var chartInset = config['display.visualizations.custom.vmviz_status_gauge.status_gauge.chartInset'] || 10;
            // start at 270 deg
            var totalPercent = config['display.visualizations.custom.vmviz_status_gauge.status_gauge.totalPercent'] || 0.75;
            // 
            var padRad = config['display.visualizations.custom.vmviz_status_gauge.status_gauge.padRad'] || 0;
            
            // The relative height of the text to display in the wave circle. 1 = 50%
            var textSize = config['display.visualizations.custom.vmviz_status_gauge.status_gauge.textSize'] || 1;
            // If true, the displayed value counts up from 0 to it's final value upon loading. If false, the final value is displayed.
            var valueCountUp = config['display.visualizations.custom.vmviz_status_gauge.status_gauge.valueCountUp'] || "true";
            // The color of the value text when the wave does not overlap it.
            var textColor = config['display.visualizations.custom.vmviz_status_gauge.status_gauge.textColor'] || "#045681";

            // Draw something here
            if(data.rows.length < 1){
                return;
            }
            // Take the first data point 
            datum = data.rows[0][0];

            // gauge max value
            var maxValue = data.rows[0][1];

            // Clear the div
            this.$el.empty();

            // divide by 2 for HALF circle
            sectionPerc = 1 / numSections / 2 ;
            
            //var radius = Math.min(parseInt(gauge.style("width")), parseInt(gauge.style("height")))/2;

            percent = Math.max(minValue, Math.min(maxValue, datum))/maxValue;

            // Added
            margin = {
                top: 20,
                right: 20,
                bottom: 30,
                left: 20
            };

            // SVG setup
            el = d3.select(this.el);
            
            width = el[0][0].offsetWidth - margin.left - margin.right;
            height = width;
            radius = Math.min(width, height) / 2;
            textPositionY = height * .4;
            textPositionX = width * .45;
            percToDeg = function (perc) {
                return perc * 360;
            };

            percToRad = function (perc) {
                return degToRad(percToDeg(perc));
            };

            degToRad = function (deg) {
                return deg * Math.PI / 180;
            };

            var svg = el.append('svg')
                          .attr('width', width + margin.left + margin.right)
                          .attr('height', height + margin.top + margin.bottom);

            chart = svg.append('g')
                       .attr('transform', 'translate(' + (width + margin.left) / 2 + ', ' + (height + margin.top) / 2 + ')');

            var labelField = config['display.visualizations.custom.vmviz_status_gauge.status_gauge.labelField'];
            //var valueField = config['display.visualizations.custom.vmviz_status_gauge.status_gauge.valueField'];
            linkEl = $('<a class="vm-status-gauge-center-text" href="#" /> ');
            linkEl.text(datum + ' ').prependTo(el);

            linkEl.click(function(e) {
                // register drilldown handler
                e.preventDefault();
                var payload = {
                    action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
                    data: {}
                };
                payload.data[labelField] = '$.trim("*")';
                this.drilldown(payload);
            }.bind(this));

            for (sectionIndx = i = 1, ref = numSections; 1 <= ref ? i <= ref : i >= ref; sectionIndx = 1 <= ref ? ++i : --i) {
                arcStartRad = percToRad(totalPercent);
                arcEndRad = arcStartRad + percToRad(sectionPerc);
                totalPercent += sectionPerc;
                startPadRad = sectionIndx === 0 ? 0 : padRad / 2;
                endPadRad = sectionIndx === numSections ? 0 : padRad / 2;
                arc = d3.svg.arc().outerRadius(radius - chartInset).innerRadius(radius - chartInset - barWidth).startAngle(arcStartRad + startPadRad).endAngle(arcEndRad - endPadRad);
                chart.append('path').attr('class', 'arc vm-arc-color' + sectionIndx).attr('d', arc);
            }

            var Needle = function () {
                function Needle(len, radius1) {
                    this.len = len;
                    this.radius = radius1;
                }

                Needle.prototype.drawOn = function (el, perc) {
                    el.append('circle').attr('class', 'needle-center').attr('cx', 0).attr('cy', 0).attr('r', this.radius);
                    return el.append('path').attr('class', 'needle').attr('d', this.mkCmd(perc));
                };

                Needle.prototype.animateOn = function (el, perc) {
                    var self;
                    self = this;
                    return el.transition().delay(500).ease('elastic').duration(3000).selectAll('.needle').tween('progress', function () {
                        return function (percentOfPercent) {
                            var progress;
                            progress = percentOfPercent * perc;
                            return d3.select(this).attr('d', self.mkCmd(progress));
                        };
                    });
                };

                Needle.prototype.mkCmd = function (perc) {
                    var centerX, centerY, leftX, leftY, rightX, rightY, thetaRad, topX, topY;
                    thetaRad = percToRad(perc / 2);
                    centerX = 0;
                    centerY = 0;
                    topX = centerX - this.len * Math.cos(thetaRad);
                    topY = centerY - this.len * Math.sin(thetaRad);
                    leftX = centerX - this.radius * Math.cos(thetaRad - Math.PI / 2);
                    leftY = centerY - this.radius * Math.sin(thetaRad - Math.PI / 2);
                    rightX = centerX - this.radius * Math.cos(thetaRad + Math.PI / 2);
                    rightY = centerY - this.radius * Math.sin(thetaRad + Math.PI / 2);
                    return 'M ' + leftX + ' ' + leftY + ' L ' + topX + ' ' + topY + ' L ' + rightX + ' ' + rightY;
                };

                return Needle;
            }();

            // Create and add gauge needle
            needle = new Needle(radius-barWidth-20, 15);
            needle.drawOn(chart, 0);
            needle.animateOn(chart, percent);

        },

        // Search data params
        getInitialDataParams: function() {
            return ({
                outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
                count: 10000
            });
        }

    });

});
