'use strict';

describe('formatters', function() {

  describe('EntityFieldsSimplifier', function() {
    it('should returns short form of fields', function() {
      var data = {
        fields: [
          { name: 'address', value: 'Lenin st. 101', type: 's' },
          { name: 'zip', value: 455000, type: 'i' },
        ]
      };
      var formatter = new EntityFieldsSimplifier();
      formatter.format(data);
      expect(data.fields.address).to.eq('Lenin st. 101');
      expect(data.fields.zip).to.eq(455000);
    });
  });

  describe('EntityChildrenSimplifier', function() {
    it('should returns short form of children', function() {
      var data = {
        children: [
          { path: 'users/denis-gukov/address', title: 'Address' },
          { path: 'users/denis-gukov/info', text: 'Info' },
        ]
      };
      var formatter = new EntityChildrenSimplifier();
      formatter.format(data);
      expect(data.children.address.title).to.eq('Address');
      expect(data.children.address.path).to.eq('users/denis-gukov/address');
      expect(data.children.info.text).to.eq('Info');
      expect(data.children.info.path).to.eq('users/denis-gukov/info');
    });
  });

  describe('EntitySimplifier', function() {
    it('should returns short form of children', function() {
      var data = {
        children: [
          {
            path: 'users/denis-gukov/addresses',
            text: 'Addresses',
            fields: [
              { name: 'title', value: 'Addresses' }
            ],
            children: [
              {
                path: 'users/denis-gukov/addresses/addr1',
                fields: [
                  { name: 'title', value: 'Address 1' },
                  { name: 'address', value: 'Lenin st. 101', type: 's' },
                  { name: 'zip', value: 455000, type: 'i' },
                ]
              },
              {
                path: 'users/denis-gukov/addresses/addr2',
                fields: [
                  { name: 'title', value: 'Address 2' },
                  { name: 'address', value: 'K. Marksa st. 99', type: 's' },
                  { name: 'zip', value: 433001, type: 'i' },
                ]
              },
            ]
          },
          { path: 'users/denis-gukov/info', text: 'Info' },
        ],
        fields: [
          { name: 'address', value: 'Lenin st. 101', type: 's' },
          { name: 'zip', value: 455000, type: 'i' },
        ]
      };
      var formatter = new EntitySimplifier();
      formatter.format(data);

      expect(data.fields.address).to.eq('Lenin st. 101');
      expect(data.fields.zip).to.eq(455000);

      expect(data.children.addresses.fields.title).to.eq('Addresses');

      expect(data.children.addresses.children.addr1.fields.title).to.eq('Address 1');
      expect(data.children.addresses.children.addr1.fields.zip).to.eq(455000);
    });
  });



});
