module Jobs
  class UpdateElasticsearchTags < Jobs::Base
    def execute(args)
      DiscourseElasticsearch::ElasticsearchHelper.index_tags(args[:tags], args[:discourse_event])
    end
  end
end
