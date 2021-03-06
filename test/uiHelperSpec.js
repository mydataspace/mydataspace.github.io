describe('UIHelper', function() {

  describe('#findIndexByPath', function () {
    var children = [{
      root: 'test',
      path: 'website/hello',
    }, {
      root: 'test',
      path: 'website/world'
    }, {
      root: 'test',
      path: 'website/test'
    }, {
      root: 'test',
      path: 'website/last'
    }];

    it('returns correct index of found item', function () {
      var i = UIHelper.findIndexByPath(children, 'website/test');
      expect(i).to.eq(2);
    });

    it('returns -1 for non-existing item', function () {
      i = UIHelper.findIndexByPath(children, 'website/none');
      expect(i).to.eq(-1);
    });
  });

  describe('#orderDataChildren', function () {
    var children = [{
      root: 'test',
      path: 'website/unknown'
    }, {
      root: 'test',
      path: 'website/hello',
    }, {
      root: 'test',
      path: 'website/world'
    }, {
      root: 'test',
      path: 'website/test'
    }, {
      root: 'test',
      path: 'website/last'
    }];

    it('', function () {
      var pathsOrder = ['website/test', 'website/world', 'website/hello', 'website/last'];
      UIHelper.orderDataChildren(children, pathsOrder);

      expect(children).to.eql([{
        root: 'test',
        path: 'website/test'
      }, {
        root: 'test',
        path: 'website/world'
      }, {
        root: 'test',
        path: 'website/hello',
      }, {
        root: 'test',
        path: 'website/last'
      }, {
        root: 'test',
        path: 'website/unknown'
      }]);
    });
  });

  describe('#getIconByPath', function() {
      it('returns valid icons of paths', function() {
          expect(UIHelper.getIconByPath('tasks')).to.eq('tasks');
          expect(UIHelper.getIconByPath('tasks/test')).to.eq('file-code-o');
          expect(UIHelper.getIconByPath('test/hello-world', true)).to.eq('folder-o');
      });
  });

  describe('#getEntityTypeByPath', function() {
      it('returns valid types of paths', function() {
          expect(UIHelper.getEntityTypeByPath('tasks')).to.eq('tasks');
          expect(UIHelper.getEntityTypeByPath('tasks/ghertwer')).to.eq('task');
          expect(UIHelper.getEntityTypeByPath('tasks/test/logs')).to.eq('logs');
          expect(UIHelper.getEntityTypeByPath('tasks/test/logs/345345')).to.eq('log');
      });
  });

  describe('#expendField', function() {
    it('returns the same for normal field', function() {
      var field = {
        name: 'test',
        type: 's',
        value: 'hello'
      };
      expect(Fields.expandField(field)).to.eql(field);
    });

    it('returns null for null', function() {
      expect(Fields.expandField(null)).to.be.null;
    });

    it('returns nested object', function() {
      var field = {
        name: 'test',
        type: 's',
        value: 'hello',
        nested: {
          name: 'test.a',
          value: 10,
          type: 'i'
        }
      };
      expect(Fields.expandField(field)).to.eql(field.nested);
    });

    it('corrent handle null fields', function() {
      var field = {
        name: 'test',
        type: 's',
        value: null
      };
      expect(Fields.expandField(field)).to.eql(field);
    });
  });


  it('#getFieldsForSave', function() {
    var dirtyFields;
    var currentFieldNames = ['a'];
    var oldFields = {
      a: 'a',
      c: 'c',
      d: 'd'
    };
    var result = Fields.getFieldsForSave(dirtyFields, currentFieldNames, oldFields);
    expect(result.length).to.equal(2);
    expect(result[0].name).to.equal('c');
    expect(result[0].value).to.equal(null);
    expect(result[1].name).to.equal('d');
    expect(result[1].value).to.equal(null);
  });

});
