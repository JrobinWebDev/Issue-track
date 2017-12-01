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
            this.template = document.getElementById("issues-template").innerHTML;
            
            // relevant to form.
            this.issueCategory = document.getElementById("issueCategoryInput");
            this.issueDesc = document.getElementById("issueDescInput");
            this.issueSeverity = document.getElementById("issueSeverityInput");
            this.issueAssignedTo = document.getElementById("issueAssignedToInput");
            this.inputForm = document.getElementById("issueInputForm");
            
            // relevant to filters:
            this.filterButtons = document.querySelectorAll('.drop-button');
            this.elementFilter = document.getElementById("issue");
            this.filterText = document.getElementById("filterText");
            this.statusDropdownContent = document.getElementById('filterDropdown');
            this.allDropDown = document.querySelectorAll(".dropdown-content");
            this.deleteClosedId = document.getElementById("deleteClosed");
            this.closed = document.getElementById("seeClosed");
            this.open = document.getElementById("seeOpen");
            this.all = document.getElementById("seeAll");
            this.riskDropdownContent = document.getElementById('riskDropdown');
            this.riskText = document.getElementById('riskText');
            this.statusText = document.getElementById('seeLow');
            this.statusText = document.getElementById('seeMedium');
            this.statusText = document.getElementById('seeHigh');
            
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
                }
            
            return issue;   
        },
        addIssue: function() {
            // prevent page refresh after issue submission.
            event.preventDefault();
            
            var issues = storage.getStorage();
            
            issues.push(app.issue());
            storage.setStorage(issues);
            // 'this' points to the 'inputForm'.
            this.reset();
            app.render();
        },
        bindEvents: function() {
            // form submission listeners
            this.inputForm.addEventListener("submit", this.addIssue);
            
            // filter listeners
            for (var i = 0; i < this.filterButtons.length; i++) {
                this.filterButtons[i].addEventListener("click", this.dropdown.bind(this));
            };
            // USE QUERY SELECTOR AND LOOP THROUGH!
            this.all.addEventListener("click", this.seeAll.bind(this));
            this.open.addEventListener("click", this.seeOpen.bind(this));
            this.closed.addEventListener("click", this.seeClosed.bind(this));
            this.deleteClosedId.addEventListener("click", this.deleteClosed);
            window.addEventListener("click", this.removeDropdown.bind(this));
            
            // issue listeners 
            this.elementFilter.addEventListener("click", function(event){
                var clicked = event.target;
                
                if (clicked.id === "deleteButton" ) {
                    var issueId = clicked.parentElement.id;
                    this.deleteIssue(issueId);
                }
                if (clicked.id === "statusButton") {
                    var issueId = clicked.parentElement.id;
                    this.closeIssue(issueId);
                }
            }.bind(this));
        },
        dropdown: function(event) {
            // toggle filter button dropdowns
            if (event.target.id === 'filterText') {
                this.statusDropdownContent.classList.toggle("show");
            } else if (event.target.id === 'riskText') {
                this.riskDropdownContent.classList.toggle("show");
            } 
        },
        removeDropdown: function(event) {
            // remove dropdowns if user clicks anywhere on window
            if(!event.target.matches(".drop-button")) {
                for(var i = 0; i < this.allDropDown.length; i++){
                    this.allDropDown[i].classList.remove("show");   
               };
            };
        },
        deleteIssue: function(id) {
            var issues = storage.getStorage();

            issues.forEach(function(issue,index){
                if (issue.id === id) {
                    issues.splice(index, 1)
                }
            })
         
            storage.setStorage(issues);
            app.render();   
        },
        closeIssue: function(id) {
            var issues = storage.getStorage();  
            
            // 'issue.statusText' is set to 'closed' so we can add closing date below.
            issues.forEach(function(issue){
                if (issue.id === id) {
                    issue.statusText = 'Closed';
                    issue.status = true;
                }
            })
       
            issues.forEach(function(issue){
                if (issue.statusText === 'Closed') {
                    issue.statusText = 'Closed on: ' + util.createDate(); 
                }
            })

            storage.setStorage(issues);
            app.render();
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
            app.render();
        },
        createFilter: function(type) {
            var issues = storage.getStorage();
            
            // check what the filter is.
            if (type === "closed") {
                issues = issues.filter(function(issue) {
                        return issue.status === true;
                    })
                this.render(issues);
                
            } else if (type === "open") {
                issues = issues.filter(function(issue) {
                        return issue.status === false;
                    })
                this.render(issues);
                
            } else if (type === "all") {
                 app.render(issues);
                }
        },
        seeClosed: function() {
            var type;
            // set className so that we can return correct filter view.
            this.elementFilter.className = "closed";
            // remove filter dropdown. 
            this.statusDropdownContent.classList.toggle("show");
            // set filter dropdown text.
            this.filterText.innerText = "Closed";
            type = 'closed';
            // create filtered array
            this.createFilter(type);
        },
        seeOpen: function() {
            var type;
            this.elementFilter.className = "open";
            this.statusDropdownContent.classList.toggle("show");
            this.filterText.innerText = "Open";
            type = 'open';
            // create filtered array
            this.createFilter(type);
            
        },
        seeAll: function() {
            var type;
            this.elementFilter.className = "all";
            this.statusDropdownContent.classList.toggle("show");
            this.filterText.innerText = "All";
            type = 'all';
            // create filtered array
            this.createFilter(type);
        }
    }; 
   
    app.init();
})();