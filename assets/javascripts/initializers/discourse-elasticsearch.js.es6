import { h } from 'virtual-dom';
import { on } from 'ember-addons/ember-computed-decorators';
import DiscourseURL from 'discourse/lib/url';
import { withPluginApi } from 'discourse/lib/plugin-api';
import discourseAutocomplete from './discourse-autocomplete';

function elasticsearch(api){
  const container = api.container;
  const siteSettings = container.lookup("site-settings:main");
      api.modifyClass('component:site-header', {
        @on("didInsertElement")
        initializeElk() {
          this._super();
          var elasticsearch_address = this.siteSettings.elasticsearch_server_ip + ":" + this.siteSettings.elasticsearch_server_port + "/_search";
          if (this.siteSettings.elasticsearch_enabled) {
            $("body").addClass("elasticsearch-enabled");
            if (!this.siteSettings.elasticsearch_server_port) {
              elasticsearch_address = this.siteSettings.elasticsearch_server_ip + "/_search";            	
            }
            setTimeout(() => {
              discourseAutocomplete._initialize({
              	elasticsearch_address: elasticsearch_address
              });
            }, 100);
          }
        }
      });

      api.createWidget('es', {
        tagName: 'li.es-holder',
        html() {
          return [
            h('form', {
              action: '/search',
              method: 'GET'
            }, [
              h('input.es-input#search-box', {
                name: "q",
                placeholder: "Search the forum...",
                autocomplete: "off"
              }),
              h('img.Typeahead-spinner',{
                src: "https://hugelolcdn.com/comments/1225799.gif"
              })
            ])
          ];
        }
      });

      api.decorateWidget('header-icons:before', function(helper) {
        if (helper.widget.siteSettings.elasticsearch_enabled) {
          return helper.attach('es');
        }
      });
}

export default {
  name : "discourse-elasticsearch",
  initialize(container) {
    withPluginApi('0.8.8', api => elasticsearch(api, container));

  }
}