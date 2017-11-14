// object literal module pattern
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
        // id creation to create unique issue identifier, which will be used to close and delete issues.
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
            this.issueDesc = document.getElementById('issueDescInput');
            this.issueSeverity = document.getElementById('issueSeverityInput');
            this.issueAssignedTo = document.getElementById('issueAssignedToInput');
            this.inputForm = document.getElementById('issueInputForm');
            
            // relevant to filter nav.
            this.dropDownClass = document.getElementById("filterDropdown");
            this.elementFilter = document.getElementById("issue");
            this.filterText = document.getElementById("filterText");
            this.dropdownContent = document.getElementsByClassName('dropdown-content');
            this.deleteResolvedId = document.getElementById("deleteClosed");
            this.resolved = document.getElementById("seeResolved");
            this.unresolved = document.getElementById("seeUnresolved");
            this.all = document.getElementById("seeAll");
            
            // relevant to count.
            this.countDiv = document.getElementById('count');
            
            // relevant to issues.
            this.deleteId = document.getElementById('deleteButton');
            this.closeId = document.getElementById('statusButton');
        },
        render: function() {
            var issues = storage.getStorage();
            // check what the filter is.
            if (this.elementFilter.className === "resolved") {
                issues = issues.filter(function(issue) {
                        return issue.status === true;
                    })
                
            } else if (this.elementFilter.className === "unResolved") {
                issues = issues.filter(function(issue) {
                        return issue.status === false;
                    })
                
            } else if (this.elementFilter.className === "all") {
                var issues = storage.getStorage();
                }
    
            this.elementFilter.innerHTML = '';
            
            // html template converted to Handlebars function.
            var templateScript = Handlebars.compile(this.template);
            var context = issues;
            // issue object is passed as context.
            var html = templateScript(context);
            // handlebars template rendered to UI.
            this.elementFilter.innerHTML += html;
            
            // invoked to update the live counter.
            util.issueCount();    
        },
        issue: function() {
            var issueId = util.uid();
            var statusText = 'Open';
            var issueDate = util.createDate();
            var status = false;
            
            // creation of the issue object.
            var issue = {
                    id: issueId,
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
            // form submission eventHandler
            this.inputForm.addEventListener("submit", this.addIssue);
            
            // filter nav eventHandlers
            this.filterText.parentElement.addEventListener("click", function(){
                this.dropDownClass.classList.toggle("show");
            }.bind(this))
            // 'this' is bound to the handler otherwise, 'this' would point to the element object that was clicked.
            this.all.addEventListener("click", this.seeAll.bind(this));
            this.unresolved.addEventListener("click", this.seeUnresolved.bind(this));
            this.resolved.addEventListener("click", this.seeResolved.bind(this));
            this.deleteResolvedId.addEventListener("click", this.deleteClosed);
            
            // issue eventHandler added to document in case no issues exist.  
            document.addEventListener("click", function(event){
                var clicked = event.target;
                
                if (clicked.id === "deleteButton" ) {
                    var issueId = clicked.parentElement.id;
                    this.deleteIssue(issueId);
                }
                if (clicked.id === "statusButton") {
                    var issueId = clicked.parentElement.id;
                    this.closeIssue(issueId);
                }
            }.bind(this))
            
            // removes filter dropdown menu when user clicks outside of it.
            window.addEventListener("click", function(event){
                if(!event.target.matches(".drop-button")) {
                    this.dropDownClass.classList.remove("show");
                }
            }.bind(this))
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
        seeResolved: function() {
            // set className so that render can return correct filter view.
            this.elementFilter.className = "resolved";
            // removes filter dropdown menu. 
            this.dropDownClass.classList.toggle("drop-button");
            // set filter dropdown text equal to the selected filter.
            this.filterText.innerText = "Resolved";
            app.render();
        },
        seeUnresolved: function() {
            this.elementFilter.className = "unResolved";
            this.dropDownClass.classList.toggle("drop-button");
            this.filterText.innerText = "Unresolved";
            app.render();       
        },
        seeAll: function() {
            this.elementFilter.className = "all";
            this.dropDownClass.classList.toggle("drop-button");
            this.filterText.innerText = "All";
            app.render();      
        }
    }; 
   
    app.init();
})();