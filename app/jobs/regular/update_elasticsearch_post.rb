module Jobs
  class UpdateElasticsearchPost < Jobs::Base
    def execute(args)
      DiscourseElasticsearch::ElasticsearchHelper.index_post(args[:post_id], args[:discourse_event])
    end
  end
end
