# name: discourse-elasticsearch
# about:
# version: 0.2
# authors: imMMX
# url: https://github.com/imMMX


gem 'json', '2.2.0'
gem 'httpclient', '2.8.3'
gem 'elasticsearch-transport', '7.2.0'
gem 'elasticsearch-api', '7.2.0'
gem 'elasticsearch', '7.2.0'


register_asset 'stylesheets/variables.scss'
register_asset 'stylesheets/elasticsearch-base.scss'
register_asset 'stylesheets/elasticsearch-layout.scss'
register_asset 'lib/typehead.bundle.js'

enabled_site_setting :elasticsearch_enabled

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

  require_dependency File.expand_path('../app/jobs/regular/update_elasticsearch_post.rb', __FILE__)
  require_dependency File.expand_path('../app/jobs/regular/update_elasticsearch_user.rb', __FILE__)
  require_dependency File.expand_path('../app/jobs/regular/update_elasticsearch_topic.rb', __FILE__)
  require_dependency File.expand_path('../app/jobs/regular/update_elasticsearch_tag.rb', __FILE__)
  require_dependency 'discourse_event'

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

  [:user_created, :user_updated].each do |discourse_event|
    DiscourseEvent.on(discourse_event) do |user|
      if SiteSetting.elasticsearch_enabled?
        Jobs.enqueue_in(0,
                        :update_elasticsearch_user,
                        user_id: user.id,
                        discourse_event: discourse_event
        )
      end
    end
  end

  [:topic_created, :topic_edited, :topic_destroyed, :topic_recovered].each do |discourse_event|
    DiscourseEvent.on(discourse_event) do |topic|
      if SiteSetting.elasticsearch_enabled?
        Jobs.enqueue_in(0,
                        :update_elasticsearch_topic,
                        topic_id: topic.id,
                        discourse_event: discourse_event
        )
        Jobs.enqueue_in(0,
                        :update_elasticsearch_tag,
                        tags: topic.tags.map(&:name),
                        discourse_event: discourse_event
        )
      end
    end
  end

  [:post_created, :post_edited, :post_destroyed, :post_recovered].each do |discourse_event|
    DiscourseEvent.on(discourse_event) do |post|
      if SiteSetting.elasticsearch_enabled?
        Jobs.enqueue_in(0,
                        :update_elasticsearch_post,
                        post_id: post.id,
                        discourse_event: discourse_event
        )
        if post.topic
          Jobs.enqueue_in(0,
                          :update_elasticsearch_tag,
                          tags: post.topic.tags.map(&:name),
                          discourse_event: discourse_event
          )
        end
      end
    end
  end
end
