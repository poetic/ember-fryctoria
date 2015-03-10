import Ember from 'ember';
import ENV   from 'dummy/config/environment';

export default Ember.Route.extend({
  setupController: function(ctrl) {
    ctrl.set('isOnline', true);
  },

  actions: {
    toggleOnline: function() {
      var ctrl = this.get('controller');
      var isOnline = ctrl.get('isOnline');

      if(isOnline) {
        var mockId = Ember.$.mockjax({
          status:       0,
          url:          /.*/,
          responseTime: 0,
        });
        ctrl.set('mockId', mockId);
      } else {
        Ember.$.mockjax.clear(ctrl.get('mockId'));
      }

      ctrl.set('isOnline', !isOnline);
    }
  }
});




