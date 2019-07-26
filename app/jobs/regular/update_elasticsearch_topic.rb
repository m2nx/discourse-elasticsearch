module Jobs
  class UpdateElasticsearchTopic < Jobs::Base
    def execute(args)
      DiscourseElasticsearch::ElasticsearchHelper.index_topic(args[:topic_id], args[:discourse_event])
    end
  end
end
