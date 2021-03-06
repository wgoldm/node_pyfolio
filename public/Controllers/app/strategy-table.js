(function (root) {


    var profitLossTitles = ['3m', '6m', '1y'];
    var profitLossNames = ['profitLoss_threeMonths', 'profitLoss_sixMonths', 'profitLoss_oneYear'];
    /**
         * Manage all gridTable's functions
         */
    var StrategyTable = root.StrategyTable = function (scope, strategy) {
        var table = this;
        this.init({
            responseHandler: function (res) {
                if (res.error) {
                    table.element.trigger('load-error.bs.table', res.error)
                    return [];
                }
                var rows = res.result.rows || [];
                rows.forEach(function (row) {
                    for (var i = 0; i < profitLossTitles.length; i++) {
                        row[profitLossNames[i]] = row.backtestFile ? 'loading...' : '';
                    }
                });
                return rows;
            },
            uniqueId: 'rowId',
            cookieIdTable: 'strategyRowsTableV3',
            cookie: true,
            clickToSelect: true,
            // sidePagination: 'server',
            showFooter: false,
            pagination: false,
            search: false,
            showRefresh: false,
            showColumns: false,
            hideCheckBoxColumn: true,
            sortName: 'rowIndex',
            sortOrder: 'desc'
        });
        /**
           * Add the default columns
           * 
           * 
           * */
        this.addDefaultsColumn = function () {
            var table = this;
            table.options.columns = [];
            table.addColumn({
                field: 'state',
                valign: 'middle',
                checkbox: true,
                sortable: false,
                rowspan: 2
            });

            table.addColumn({
                field: 'rowIndex',
                title: '#',
                titleTooltip: 'The algorithm number',
                class: 'no-left-border',
                align: 'left',
                //formatter: function (value, row, index) {
                //    return '@algo('+value+')';
                //},
                rowspan: 2
            });

            table.addColumn({
                field: 'chart',
                title: 'Chart',
                titleTooltip: 'Chart the ptx row',
                clickToSelect: false,
                width: 50,
                searchable: false,
                sortable: false,
                rowspan: 2,
                formatter: function (value, row, index) {
                    return '<a class="drawLine" href="javascript:void(0)" style="margin-right:3px" title="Draw line chart" ><img src="/static_files/images/chartline16.png?lastModified=20160909T1938"/></a>';
                },
                events: {
                    'click .drawLine': function (e, value, row, index) {
                        table.emit('drawRow', row, index);
                    }

                }
            });
            table.addColumn({
                field: 'export',
                title: 'Export',
                titleTooltip: 'Export the time series to CSV file',
                clickToSelect: false,
                width: 50,
                searchable: false,
                sortable: false,
                rowspan: 2,
                formatter: function (value, row, index) {
                    var imageUrl = row.loadingExport ? 'loading.gif' : 'export16.png';
                    var imageClass = row.loadingExport ? '' : 'exportRow';
                    return '<a class="' + imageClass + '" href="javascript:void(0)" style="margin-right:3px" title="Export the time series to CSV file" ><img style="width:16px" src="/static_files/images/' + imageUrl + '"/></a>';
                },
                events: {
                    'click .exportRow': function (e, value, row, index) {
                        if (table.fn('getData').some(function (row) {
                                                    return row.loadingExport;
                        }))
                            return alert('Sorry, we only allow one download at a time. Thanks for your patience!');
                        table.emit('exportRow', row, index);
                    }
                }
            });
            table.addColumn({
                field: 'strategyName',
                title: 'Strategy Name',
                titleTooltip: 'The strategy name',
                class: 'no-left-border',
                align: 'center',
                rowspan: 2,
                visible: !utilities.isMobile()
            });

            table.addColumn({
                field: 'query',
                title: 'Algo',
                align: 'center',
                rowspan: 2
            });
            table.addColumn({
                field: 'performance',
                title: 'Performance',
                align: 'center',
                colspan: 3
            });

            for (var i = 0; i < profitLossTitles.length; i++) {
                table.addColumn({
                    field: profitLossNames[i],
                    title: profitLossTitles[i],
                    formatter: utilities.percentFormatter,
                    visible: !utilities.isMobile()
                }, true);
            }

        }

        /**
           * Load the strategy's rows data and reset table's rows
           * 
           * 
           * */
        this.refreshStrategyRows = function (callback) {
            var table = this;
            table.refreshTable('/api/kafka/GetStrategy?strategyName=' + strategy.name, callback);
        }
        /**
             * Load the backtesting data and update the rows
             * 
             * 
             * */
        this.refreshBacktestingData = function () {
            //var table = this;
            ////Load the backtestig stats
            //angular.requests.get('/api/kafka/GetStrategy', {
            //    view: 'backtest',
            //    strategyName: strategy.name,
            //    //what fields to include in stats 
            //    backtestFields: profitLossNames
            //}, function (err, data) {
            //    var backtestingRows = data.result.rows || [];
            //    backtestingRows.forEach(function (backtestRow) {
            //        table.fn('updateByUniqueId', { id: backtestRow.rowId, row: backtestRow.stats });
            //    });
            //});
        }
        var table_contextMenuTemplate = "<div><ul><li id='chartItem'>Chart strategy</li><li id='deleteItem'>Delete</li></ul></div>";
        this.on('created', function (table) {
            table.element.contextMenu(table_contextMenuTemplate, function (menu) {
                menu.on('shown', function () {
                    var selected = table.getSelections();
                    menu.showItem('addRowItem', !selected.length);
                    menu.showItem('deleteItem', selected.length);
                    menu.showItem('chartItem', selected.length == 1);

                })
                menu.on('itemclick', function (e) {
                    var id = e.args.id;
                    if (id == 'chartItem') {
                        var row = table.getSelections()[0];
                        table.emit('drawRow', row);
                    }
                });
            });
        });

    };

    StrategyTable.prototype = new BootstrapTableWrapper();

    //This module manage the gridTable operations
    angular.module('strategy-table-directives', []).
        directive('strategyTable', [function () {
            return {
                restrict: 'A',
                template: '<table class="strategy-rows-table"> </table>',
                replace: true,
                link: function (scope, element, attr) {
                    var strategy = scope.strategy,
                        table = new StrategyTable(scope, strategy);
                    //Set a reference to the table rows using strategy
                    strategy.strategyRowsTable = table;

                    table.addDefaultsColumn();
                    table.drawTable(element, element.parent());

                    //fires after load the data
                    table.element.on('load-success.bs.table', function (eventArgs, data) {
                        table.refreshBacktestingData();
                    });

                    table.on('drawRow', function (row) {
                        row.panelTitle = 'ALGO '+row.rowIndex;
                        var tabs = strategy.chartTabsManager;
                        tabs.drawRowInTab(tabs.getSelectedTab() || tabs.addNewChartTab(), row);
                        scope.$applyAsync();
                    });
                    table.on('exportRow', function (row, index) {
                        table.fn('updateRow', {
                            index: index,
                            row: {
                                loadingExport: true
                            }
                        });
                        strategy.api.exportStrategyRowData(row, function (err, results) {
                            if (err)  alert(err);
                            table.fn('updateRow', {
                                index: index,
                                row: {
                                    loadingExport: false
                                }
                            });
                        });
                    });
                    strategy.emit('strategyRowsTableCreated', table);
                    if (table.onCreated) table.onCreated();
                }
            }
        }]);


})(this)