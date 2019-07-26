desc "configure indices and upload data"
task "elasticsearch:initialize" => :environment do
  Rake::Task["elasticsearch:configure"].invoke
  Rake::Task["elasticsearch:reindex"].invoke
end

desc "configure elasticsearch index settings"
task "elasticsearch:configure" => :environment do
  elasticsearch_configure_users
  #elasticsearch_configure_posts
  #elasticsearch_configure_tags
end

desc "reindex everything to elasticsearch"
task "elasticsearch:reindex" => :environment do
  elasticsearch_reindex_users
  # elasticsearch_reindex_posts
  # elasticsearch_reindex_tags
end


def elasticsearch_configure_users
  puts "[Starting] Pushing users index settings to Elasticsearch"
  # DiscourseElasticsearch::ElasticsearchHelper.elasticsearch_index(
  #   DiscourseElasticsearch::ElasticsearchHelper::USERS_INDEX).set_settings(
  #   "searchableAttributes" => ["unordered(username)", "unordered(name)"],
  #   "attributesToHighlight" => [:username, :name],
  #   "attributesToRetrieve" => [:username, :name, :url, :avatar_template, :likes_received, :days_visited],
  #   "customRanking" => ["desc(likes_received)", "desc(days_visited)"],
  #   "removeWordsIfNoResults" => "allOptional"
  # )
  puts "[Finished] Successfully configured users index in Elasticsearch"
end

def elasticsearch_reindex_users

  puts "[Starting] Pushing users to Elasticsearch"
  user_records = []
  User.all.each do |user|
    #user_records << DiscourseElasticsearch::ElasticsearchHelper.to_user_record(user)
    user_record = DiscourseElasticsearch::ElasticsearchHelper.to_user_record(user)
    puts user_record
  end
  # puts "[Progress] Gathered users from Discourse"
  # DiscourseElasticsearch::ElasticsearchHelper.elasticsearch_index(
  #   DiscourseElasticsearch::ElasticsearchHelper::USERS_INDEX).add_objects(user_records)
  # puts "[Finished] Successfully pushed #{user_records.length} users to Algolia"
end
