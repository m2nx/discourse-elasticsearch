desc "configure indices and upload data"
task "elasticsearch:initialize" => :environment do
  Rake::Task["elasticsearch:configure"].invoke
  Rake::Task["elasticsearch:reindex"].invoke
end

desc "configure elasticsearch index settings"
task "elasticsearch:configure" => :environment do
  elasticsearch_configure_users
  elasticsearch_configure_posts
  elasticsearch_configure_tags
end

desc "reindex everything to elasticsearch"
task "elasticsearch:reindex" => :environment do
  elasticsearch_reindex_users
  elasticsearch_reindex_posts
  elasticsearch_reindex_tags
end

desc "reindex users in elasticsearch"
task "elasticsearch:reindex_users" => :environment do
  elasticsearch_reindex_users
end

desc "reindex posts in elasticsearch"
task "elasticsearch:reindex_posts" => :environment do
  elasticsearch_reindex_posts
end

desc "reindex tags in elasticsearch"
task "elasticsearch:reindex_tags" => :environment do
  elasticsearch_reindex_tags
end

def elasticsearch_configure_users
  puts "[Starting] Cleaning users index to Elasticsearch"
  DiscourseElasticsearch::ElasticsearchHelper.clean_indices(DiscourseElasticsearch::ElasticsearchHelper::USERS_INDEX)
  puts "[Finished] Successfully configured users index in Elasticsearch"
end

def elasticsearch_configure_posts
  puts "[Starting] Cleaning posts index to Elasticsearch"
  DiscourseElasticsearch::ElasticsearchHelper.clean_indices(DiscourseElasticsearch::ElasticsearchHelper::POSTS_INDEX)
  puts "[Finished] Successfully configured posts index in Elasticsearch"
end

def elasticsearch_configure_tags
  puts "[Starting] Cleaning tags index to Elasticsearch"
  DiscourseElasticsearch::ElasticsearchHelper.clean_indices(DiscourseElasticsearch::ElasticsearchHelper::TAGS_INDEX)
  puts "[Finished] Successfully configured tags index in Elasticsearch"
end

def elasticsearch_reindex_users

  puts "[Starting] Pushing users to Elasticsearch"
  User.all.each do |user|
    #user_records << DiscourseElasticsearch::ElasticsearchHelper.to_user_record(user)
    puts user.id
    user_record = DiscourseElasticsearch::ElasticsearchHelper.index_user(user.id, '')
    puts user_record
  end
end

def elasticsearch_reindex_posts
  puts "[Starting] Pushing posts to Elasticsearch"
  post_records = []
  Post.all.includes(:user, :topic).each do |post|
    if DiscourseElasticsearch::ElasticsearchHelper.should_index_post?(post)
      post_records << DiscourseElasticsearch::ElasticsearchHelper.to_post_records(post)
    end
  end
  post_records.flatten!
  puts "[Progress] Gathered posts from Discourse"
  post_records.each_slice(100) do |slice|
    DiscourseElasticsearch::ElasticsearchHelper.add_elasticsearch_posts(
      DiscourseElasticsearch::ElasticsearchHelper::POSTS_INDEX, slice.flatten)
    puts "[Progress] Pushed #{slice.length} post records to Elasticsearch"
  end
  puts "[Finished] Successfully pushed #{post_records.length} posts to Elasticsearch"
end


def elasticsearch_reindex_tags
  puts "[Starting] Pushing tags to Elasticsearch"
  tag_records = []
  Tag.all.each do |tag|
    if DiscourseElasticsearch::ElasticsearchHelper.should_index_tag?(tag)
      tag_records << DiscourseElasticsearch::ElasticsearchHelper.to_tag_record(tag)
    end
  end
  puts "[Progress] Gathered tags from Discourse"
  DiscourseElasticsearch::ElasticsearchHelper.add_elasticsearch_tags(
    DiscourseElasticsearch::ElasticsearchHelper::TAGS_INDEX, tag_records)
  puts "[Finished] Successfully pushed #{tag_records.length} tags to Elasticsearch"
end
