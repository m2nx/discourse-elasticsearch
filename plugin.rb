# name: discourse-elasticsearch
# about:
# version: 0.1
# authors: imMMX
# url: https://github.com/imMMX


gem 'json', '2.2.0'
gem 'httpclient', '2.8.3'
gem 'elasticsearch-transport', '7.2.0'
gem 'elasticsearch-api', '7.2.0'
gem 'elasticsearch', '7.2.0'


register_asset "stylesheets/common/discourse-elasticsearch.scss"


enabled_site_setting :discourse_elasticsearch_enabled

PLUGIN_NAME ||= "discourse-elasticsearch".freeze

after_initialize do
  load File.expand_path('../lib/discourse_elasticsearch/elasticsearch_helper.rb', __FILE__)

  # see lib/plugin/instance.rb for the methods available in this context


  module ::DiscourseElasticsearch
    class Engine < ::Rails::Engine
      engine_name PLUGIN_NAME
      isolate_namespace DiscourseElasticsearch
    end
  end


  require_dependency "application_controller"
  class DiscourseElasticsearch::ActionsController < ::ApplicationController
    requires_plugin PLUGIN_NAME

    before_action :ensure_logged_in

    def list
      render json: success_json
    end
  end

  DiscourseElasticsearch::Engine.routes.draw do
    get "/list" => "actions#list"
  end

  Discourse::Application.routes.append do
    mount ::DiscourseElasticsearch::Engine, at: "/discourse-elasticsearch"
  end

end
