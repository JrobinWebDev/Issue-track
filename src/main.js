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
            var id = Math.random()
                .toString(36)
                .substring(3);
            
            return id;
        },
        createDate: function() {
            var d = new Date(); 
            var dString = d.toGMTString();
            // remove 'GMT' from end of date.
            var sliceGmt = dString.slice(0, 25);
            
            return sliceGmt; 
        },
        issueCount: function() {
            var issues = storage.getStorage(); 
            // on start-up set counter equal to 0.
            if (issues === null) {
                app.countDiv.innerHTML = 'Total Issues: ' + '<b>' + '0' + '<b>';
            } else {
                app.countDiv.innerHTML = 'Total Issues: ' + '<b>' + issues.length + '<b>';
            }
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
                issues = storage.getStorage();
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
        addIssue: function() {
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
            
            // filter listeners
            this.filterButton.addEventListener('click', this.dropdown.bind(this));
            
            for (var i = 0; i < this.filterId.length; i++) {
                this.filterId[i].addEventListener('click', this.setFilter.bind(this));
            }
            
            this.deleteClosedId.addEventListener('click', this.deleteClosed.bind(this));
            
            // dropdown listeners
            window.addEventListener('click', this.removeDropdown.bind(this));
            
            // issue listeners 
            this.elementFilter.addEventListener('click', function(event){
                var clicked = event.target;
                var issueId = clicked.parentElement.id;
                
                if (clicked.id === 'deleteButton' ) {
                    this.deleteIssue(issueId);
                }
                if (clicked.id === 'statusButton') {
                    this.closeIssue(issueId);
                }
            }.bind(this));
        },
        dropdown: function() {
            // toggle filter button dropdowns
            this.dropdownContent.classList.toggle('show');
        },
        removeDropdown: function(event) {
            // remove dropdowns if user clicks anywhere on window
            if(!event.target.matches('.drop-button')) {
                    this.dropdownContent.classList.remove('show');   
               }
        },
        deleteIssue: function(id) {
            // grab the current filter
            var filterType = this.filterEl.className;
    
            var issues = storage.getStorage();

            issues.forEach(function(issue,index){
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
            this.addClosingDate()
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
            var issues = storage.getStorage();  
            
            // decrement loop removes closed issues.
            for (var i = issues.length -1; i >= 0; i--) {
                if(issues[i].status === true) {
                    issues.splice(i, 1);
                }
            }

            storage.setStorage(issues);
            this.render();
        },
        getFilteredArray: function(type) {
            var issues = storage.getStorage();
            // object lookup for easy filter access
            var filters = {
                'open': function() {
                    issues = issues.filter(function(issue) {
                        return issue.status === false;
                    });
                    
                    app.render(issues);    
                },
                'closed': function() {
                    issues = issues.filter(function(issue) {
                        return issue.status === true;
                    });
                    
                    app.render(issues);
                },
                'all': function() {
                    app.render(issues);  
                },
                'low': function() {
                    issues = issues.filter(function(issue) {
                        return issue.severity === 'low';
                    });
                    
                    app.render(issues);      
                },
                'medium': function() {
                    issues = issues.filter(function(issue) {
                        return issue.severity === 'medium';
                    });
            
                    app.render(issues); 
                },
               'high': function() {
                   issues = issues.filter(function(issue) {
                        return issue.severity === 'high';
                    });
                   
                    app.render(issues); 
               }
            };
            // invoke the correct function
            filters[type]();
        }, 
        setFilter: function(event) {
            // grab id name of click
            var type = event.target.id;
            
            var filterId = {
                'seeOpen': function() {
                     // set className to current filter.
                    app.elementFilter.className = 'open';
                    // remove filter dropdown. 
                    app.dropdown();
                    // set filter dropdown text.
                    app.filterText.innerText = 'Status Open';
                    // create filtered array
                    app.getFilteredArray('open');
                },
                'seeClosed': function() {
                    app.elementFilter.className = 'closed'; 
                    app.dropdown();
                    app.filterText.innerText = 'Status Closed';
                    app.getFilteredArray('closed');
                },
                'seeAll': function() {
                    app.elementFilter.className = 'all';
                    app.dropdown();
                    app.filterText.innerText = 'All';
                    app.getFilteredArray('all');  
                },
                'seeLow': function() {
                    app.elementFilter.className = 'low';
                    app.dropdown();
                    app.filterText.innerText = 'Risk Low';
                    app.getFilteredArray('low');
                },
                'seeMedium': function() {
                    app.elementFilter.className = "medium";
                    app.dropdown();
                    app.filterText.innerText = 'Risk Medium';
                    app.getFilteredArray('medium');
                },
                'seeHigh': function() {
                    app.elementFilter.className = 'high';
                    app.dropdown();
                    app.filterText.innerText = 'Risk High';
                    app.getFilteredArray('high');
                }
            };
            
            filterId[type]();
        }
    };
    
    app.init()
    
})();