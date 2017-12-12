describe('util.uid()', function() {
    var id;
    
    // calculate before running
    beforeEach(function() {
       id = util.uid(); 
    });
});
   
describe('util.uid()', function() {
    
    it('should create a unique identifier', function() {
       expect(util.uid()).not.toBe('123'); 
    });
     
});
    
