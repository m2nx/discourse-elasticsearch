export default {

  name: "discourse-autocomplete",
  initialize() {},
  _initialize(options) {
    //getlogin status
    var currentUser = Discourse.User.current();
    if (!currentUser) {
      $('.Typeahead-spinner').css("left","390px");
    }
    //ajax function
    var autocomplete = function(query, processSync, processAsync){
      //Get text from the input field
      var text = $('#search-box').val(),
      //ES Query
          json = {
                  "query":{
                      "multi_match":
                      {"query":text,
                       "fields":[],
                       "type":"best_fields"
                      }
                  }
              };
      // ajax var init
      var url         =   options.elasticsearch_address,
          data        =   json,
          formatType  =   "json",
          type        =   "post",     
          contentType =   "application/json; charset=utf-8";
      console.log(url);
        if(type === "post" && formatType === "json"){
            data = JSON.stringify(data);
        }
        if(formatType === "json"){
            contentType="application/json";
        }
      return $.ajax({
                dataType : "json",
                async : true,
                type:type,
                cache: false,
                url:url,
                data:data,
                contentType:contentType,
                timeout:30000
            }).then(function(rs){
                var dfd = $.Deferred();
                var results = $.map([0], function() {     

                 //Parse the results and return them
                  var resultsData = rs.hits,
                      resultsLength = Object.keys(resultsData.hits).length,
                      datum = [];

                 for (var i = 0; i < resultsLength; i++) {
                    var resultsArray = resultsData.hits[i]._source,
                        resultsIndex = resultsData.hits[i]._index;
                    if (resultsIndex == "discourse-users") {
                      var user_avatar = resultsArray.avatar_template.replace("\{size}", 50);
                      datum.push({
                          // user
                          user_avatar_template: user_avatar,
                          user_username: resultsArray.username,
                          user_likes_received: resultsArray.likes_received,
                          url: resultsArray.url
                      });
                    }else if (resultsIndex == "discourse-tags") {
                      datum.push({
                          // tag
                          tag_name: resultsArray.name,
                          tag_topic_count: resultsArray.topic_count,
                          url:resultsArray.url
                      });
                    }else if (resultsIndex == "discourse-posts") {
                      var topic_name = resultsArray.topic.title,
                          topic_view = resultsArray.topic.views,
                          topic_url = resultsArray.topic.url,
                          category = resultsArray.category.name,
                          category_color = resultsArray.category.color,
                          category_url = resultsArray.category.url,
                          author = resultsArray.user.username,
                          author_url = resultsArray.user.url,
                          pre = resultsArray.content;       

                     datum.push({
                          // post
                          post_topic_name: topic_name,
                          post_topic_view: topic_view,
                          url: topic_url,
                          post_category: category,
                          post_category_color: category_color,
                          post_category_url: category_url,
                          post_author: author,
                          post_author_url: author_url,
                          post_pre: pre       

                     });
                    }       

                 }
                    return datum;
              });
              processAsync(results);

            return dfd.promise();
            },function(){
                alert("网络异常");
            }).always(function(rs){

            });
    }





  $('#search-box').typeahead({
      highlight: true,
      minLength: 1
    }, 
    {
      name: 'posts',
      displayKey: 'value',
      source: autocomplete,
      async: true,
      limit: 6,
      templates: {
        empty: [
          '<div class="empty-message">',
            '无结果',
          '</div>'
        ].join('\n'),
        footer: [
          '<div class="show-more">',
            '<a class="advanced-search" onclick="document.location.href="/search"; document.reload();" href="/search">更多...</a>',
          '<div>'
        ].join('\n'),
        suggestion: function(value) {
          if (value.post_topic_name != undefined) {
            return '<div class="es-dataset-posts"><div class="hit-post"><div class="hit-post-title-holder"><span class="hit-post-topic-title"><a href="' + value.url + '">'+ value.post_topic_name + '</a></span><span class="hit-post-topic-views" title="Number of times the topic has been viewed">'+ value.post_topic_view + '</span></div><div class="hit-post-category-tags"><span class="hit-post-category"><span class="badge-wrapper bullet"><span class="badge-category-bg" style="background-color: #'+ value.post_category_color +';"></span><a class="badge-category hit-post-category-name" href="'+ value.post_category_url +'">'+ value.post_category + '</a></span></span></div><div class="hit-post-content-holder"><a class="hit-post-username" href="'+ value.post_author_url +'">'+ value.post_author + '</a>:<span class="hit-post-content">'+ value.post_pre +'</span></div></div></div>'
          }else{
            return '<span></span>'
            
          }
        }
      }
    },{
      name: 'users-tags',
      displayKey: 'value',
      source: autocomplete,
      async: true,
      limit: 6,
      templates: {
        empty: "",
        suggestion: function(value) {
          if (value.tag_name != undefined) {
            return '<div class="es-dataset-tags"><a href="'+ value.url +'"><div class="hit-tag"><span class="hit-tag-name">#'+ value.tag_name +' </span><span class="hit-tag-topic_count" title="Number of topics with this tag"> '+ value.tag_topic_count +'</span></div></a></div>'
          }else if (value.user_username != undefined){
            return '<div class="es-dataset-users"><a href="'+ value.url +'"><div class="hit-user-left"><img class="hit-user-avatar" src="'+ value.user_avatar_template + '" /></div><div class="hit-user-right"><div class="hit-user-username-holder"><span class="hit-user-username">@'+ value.user_username + '</span><span class="hit-user-custom-ranking" title="Number of likes the user has received"><span class="hit-user-like-heart"> ❤ </span>' + value.user_likes_received + '</span></div></div></a></div>'
          }else{
            return '<span></span>'  
          }
        }
      }

    }).on('typeahead:selected', function(event, datum) {
      window.location = datum.url; 
    }).on('typeahead:asyncrequest', function() {
        $('.Typeahead-spinner').show();
    }).on('typeahead:asynccancel typeahead:asyncreceive', function() {
        $('.Typeahead-spinner').hide();
    });

    $("#search-box").on('focus', function (event) {
      $(this).select();
    });
  }
}

