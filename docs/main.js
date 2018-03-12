(function() {
    'use strict';
    
    // easy access to storage.
    var storage = { 
        initStorage: function() {
            var issues = [];
            // on start-up setup issues array.
            if (localStorage.getItem('issues') === null ) {
                localStorage.setItem('issues', JSON.stringify(issues));             
            }
        },
        setStorage: function(issues) {
            localStorage.setItem('issues', JSON.stringify(issues));
        },
        getStorage: function() {
            var issues = JSON.parse(localStorage.getItem('issues'));
            return issues;
        }
    }; 
    
    var util = {
        // creation of unique issue id - used to close and delete issues.
        uid: function() {
            return Math.random().toString(36).substring(3);
        },
        createDate: function() {
            // remove 'GMT' from end of date.
            return new Date().toGMTString().slice(0, 25); 
        },
        issueCount: function() {
            var issues = storage.getStorage();
            var noIssues = 'Total Issues: ' + '<b>' + '0' + '<b>';
            var issueNum = 'Total Issues: ' + '<b>' + issues.length + '<b>';
            // on start-up set counter equal to 0.
            !issues.length ? app.countDiv.innerHTML = noIssues : app.countDiv.innerHTML = issueNum;
        }
    };
    
    var app = {
         init: function() {
            storage.initStorage();
            this.cacheDom();
            this.bindEvents();
            this.render();
        },
        // caching DOM queries for later.
        cacheDom: function() {
            // relevant to Handlebars.
            this.template = document.getElementById('issues-template').innerHTML;
            
            // relevant to form.
            this.issueCategory = document.getElementById('issueCategoryInput');
            this.issueDesc = document.getElementById('issueDescInput');
            this.issueSeverity = document.getElementById('issueSeverityInput');
            this.issueAssignedTo = document.getElementById('issueAssignedToInput');
            this.inputForm = document.getElementById('issueInputForm');
            
            // relevant to filters:
            this.filterEl = document.getElementById('issue');
            this.filterButton = document.querySelector('.drop-button');
            this.elementFilter = document.getElementById('issue');
            this.filterText = document.getElementById('filterText');
            this.dropdownContent = document.getElementById('filterDropdown');
            this.deleteClosedId = document.getElementById('deleteClosed');
            this.filterId = document.querySelectorAll('a');
            
            // relevant to count.
            this.countDiv = document.getElementById('count');
        },
        render: function(filteredIssues) {
            var issues;
            if(filteredIssues) {
                issues = filteredIssues;
            } else {
                issues = app.getFilteredArray(this.filterEl.className, true);
            }
            
            // html template converted to Handlebars function.
            var templateScript = Handlebars.compile(this.template);
            var context = issues;
            // issue object is passed as context.
            var html = templateScript(context);
            // handlebars template rendered to UI.
            this.elementFilter.innerHTML = html;
            
            // invoked to update the live counter.
            util.issueCount();    
        },
        issue: function() {
            var issueId = util.uid();
            var statusText = 'Open';
            var issueDate = util.createDate();
            var status = false;
            
            // creation of the issue object.
            var issue = 
                {
                    id: issueId,
                    category: this.issueCategory.value,
                    description: this.issueDesc.value,
                    severity: this.issueSeverity.value,
                    assignedTo: this.issueAssignedTo.value,
                    statusText: statusText,
                    date: issueDate,
                    status: status
                };
            
            return issue;   
        },
        addIssue: function(event) {
            var issues = storage.getStorage();
            // prevent page refresh after issue submission.
            event.preventDefault();
            
            issues.push(app.issue());
            storage.setStorage(issues);
            // 'this' points to the 'inputForm'.
            this.reset();
            app.render();
        },
        bindEvents: function() {
            // form submission listeners
            this.inputForm.addEventListener('submit', this.addIssue);
            
            // filter button listeners
            this.filterButton.addEventListener('click', this.dropdown.bind(this));
            
            for (var i = 0; i < this.filterId.length; i++) {
                this.filterId[i].addEventListener('click', this.findFilter.bind(this));
            }
            
            this.deleteClosedId.addEventListener('click', this.deleteClosed.bind(this));
            
            // dropdown listeners
            window.addEventListener('click', this.removeDropdown.bind(this));
            
            // issue listeners 
            this.elementFilter.addEventListener('click', function(event){
                var clicked = event.target;
                var issueId = clicked.parentElement.id;
                
                if (clicked.id === 'deleteButton' ) {
                    // add transition
                    this.deleteTransition(event);
                    // allow time for transition then delete issue
                    setTimeout(function() {
                        this.deleteIssue(issueId);
                    }.bind(this), 700);
                }
                
                if (clicked.id === 'statusButton') {
                    this.closeIssue(issueId);
                }
            }.bind(this));
        },
        dropdown: function() {
            // show dropdown only if we have issues
            if (storage.getStorage().length) {
                this.dropdownContent.classList.toggle('show');   
            }
        },
        removeDropdown: function(event) {
            // remove dropdown if user clicks anywhere on window
            if(!event.target.matches('.drop-button')) {
                    this.dropdownContent.classList.remove('show');   
               }
        },
        deleteTransition: function(event) {
            var issueToDelete = event.target.parentElement.parentElement;
            // add transition class
            issueToDelete.classList.add('delete-transition');
        },
        deleteIssue: function(id) {
            // grab the current filter
            var filterType = this.filterEl.className;
    
            var issues = storage.getStorage();

            issues.forEach(function(issue, index){
                if (issue.id === id) {
                    issues.splice(index, 1);
                }
            });
            
            storage.setStorage(issues);
            // render the correct filter
            this.getFilteredArray(filterType);
        },
        closeIssue: function(id) {
            var filterType = this.filterEl.className;
            
            var issues = storage.getStorage();  
            
            // close the issue
            issues.forEach(function(issue){
                if (issue.id === id) {
                    issue.statusText = 'Closed';
                    issue.status = true;
                }
            });
          
            storage.setStorage(issues);
            this.addClosingDate();
            this.getFilteredArray(filterType);
        },
        addClosingDate: function() {
            var issues = storage.getStorage(); 
            // add closing date to closed issues
            issues.forEach(function(issue){
                if (issue.statusText === 'Closed') {
                    issue.statusText = 'Closed on: ' + util.createDate(); 
                }
            });
            
            storage.setStorage(issues);
        },
        deleteClosed: function() {
            var self = this;
            var currentFilter = this.filterEl.className;
            var issueContainer = document.querySelector('.issue');
            var issues = storage.getStorage();
            
            // delete closed issues and run animation if present in current filter view
            if (this.checkForClosed(issues)) {
                if (this.checkForClosed(this.getFilteredArray(currentFilter, true))) {
                    issueContainer.classList.add('delete-transition');  
                } 
            
                // decrement loop removes closed issues after transition.
                setTimeout(function() {
                    for (var i = issues.length -1; i >= 0; i--) {
                        if(issues[i].status === true) {
                            issues.splice(i, 1);
                        }
                    }
                    storage.setStorage(issues);
                    self.render();
                }, 700);
                
            } else {

                return;
            }
        },
        checkForClosed: function(issues) {
            return issues.some(function(issue) {
                return issue.status;
            });
        },
        checkType: function(check, filteredArray) {
            if(!check) {
                app.render(filteredArray);
            } else {
                return filteredArray;   
            } 
        },
        getFilteredArray: function(type, check) {
            var issues = storage.getStorage();
            // object lookup for easy filter access
            var filters = {
                'open': function() {
                    issues = issues.filter(function(issue) {
                        return issue.status === false;
                    });
                    
                    return app.checkType(check, issues);  
                },
                'closed': function() {
                    issues = issues.filter(function(issue) {
                        return issue.status === true;
                    });
                    
                    return app.checkType(check, issues); 
                },
                'all': function() {
                    return app.checkType(check, issues);   
                },
                'low': function() {
                    issues = issues.filter(function(issue) {
                        return issue.severity === 'low';
                    });
                    
                    return app.checkType(check, issues);     
                },
                'medium': function() {
                    issues = issues.filter(function(issue) {
                        return issue.severity === 'medium';
                    });
            
                   return app.checkType(check, issues);  
                },
               'high': function() {
                   issues = issues.filter(function(issue) {
                        return issue.severity === 'high';
                    });
                   
                   return app.checkType(check, issues);  
               }
            };

            return filters[type]();
        },
        processFilter: function(filter, filterText) {
            // set className to current filter.
            app.elementFilter.className = filter;
            // remove filter dropdown. 
            app.dropdown();
            // set filter dropdown text.
            app.filterText.innerText = filterText;
            // create filtered array
            app.getFilteredArray(filter); 
        },
        findFilter: function(event) {
            // grab id name of click
            var type = event.target.id;
            
            var filterId = {
                'seeOpen': function() {
                    app.processFilter('open', 'Status Open');
                },
                'seeClosed': function() {
                    app.processFilter('closed', 'Status Closed');
                },
                'seeAll': function() {
                    app.processFilter('all', 'All');
                },
                'seeLow': function() {
                    app.processFilter('low', 'Risk Low');
                },
                'seeMedium': function() {
                    app.processFilter('medium', 'Risk Medium');
                },
                'seeHigh': function() {
                    app.processFilter('high', 'Risk High');
                }
            };
            
            filterId[type]();
        }
    };
    
    app.init();
    
})();