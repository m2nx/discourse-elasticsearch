module Jobs
  class UpdateElasticsearchUser < Jobs::Base
    def execute(args)
      DiscourseElasticsearch::ElasticsearchHelper.index_user(args[:user_id], args[:discourse_event])
    end
  end
end
