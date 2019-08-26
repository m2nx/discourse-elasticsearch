export default {

  name: "discourse-autocomplete",
  initialize() {},
  _initialize(options) {
    //getlogin status; if visitor loading image place
    var currentUser = Discourse.User.current();
    if (!currentUser) {
      $('.Typeahead-spinner').css("left","390px");
    }
    // ajax function
    var callES = function(ESUrl){
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
              },
          data        =   json,
          formatType  =   "json",
          type        =   "post",     
          contentType =   "application/json; charset=utf-8";
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
        url:ESUrl,
        data:data,
        contentType:contentType,
        timeout:30000
      })
    }


    //discourse-posts source org
    var discoursePosts = function(query, processSync, processAsync){
      var url         =   options.elasticsearch_address + "/discourse-posts/_search";

      return callES(url).then(function(rs){
                var dfd = $.Deferred();
                var results = $.map([0], function() {     

                 //Parse the results and return them
                  var resultsData = rs.hits,
                      resultsLength = Object.keys(resultsData.hits).length,
                      datum = [];

                 for (var i = 0; i < resultsLength; i++) {
                    var resultsArray = resultsData.hits[i]._source,
                        topic_name = resultsArray.topic.title,
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
                    return datum;
              });
              processAsync(results);

            return dfd.promise();
            },function(){
                alert("网络异常");
            });
    }


    //discourse-users source org
    var discourseUsers = function(query, processSync, processAsync){
      var url         =   options.elasticsearch_address + "/discourse-users/_search";

      return callES(url).then(function(rs){
                var dfd = $.Deferred();
                var results = $.map([0], function() {     

                 //Parse the results and return them
                  var resultsData = rs.hits,
                      resultsLength = Object.keys(resultsData.hits).length,
                      datum = [];

                 for (var i = 0; i < resultsLength; i++) {
                    var resultsArray = resultsData.hits[i]._source,
                        user_avatar = resultsArray.avatar_template.replace("\{size}", 50);

                      datum.push({
                          // user
                          user_avatar_template: user_avatar,
                          user_username: resultsArray.username,
                          user_likes_received: resultsArray.likes_received,
                          url: resultsArray.url
                      });     

                 }
                    return datum;
              });
              processAsync(results);

            return dfd.promise();
            },function(){
                alert("网络异常");
            });
    }

    //discourse-tags source org
    var discourseTags = function(query, processSync, processAsync){
      var url         =   options.elasticsearch_address + "/discourse-tags/_search";

      return callES(url).then(function(rs){
                var dfd = $.Deferred();
                var results = $.map([0], function() {     

                 //Parse the results and return them
                  var resultsData = rs.hits,
                      resultsLength = Object.keys(resultsData.hits).length,
                      datum = [];

                 for (var i = 0; i < resultsLength; i++) {
                    var resultsArray = resultsData.hits[i]._source;
                      datum.push({
                          // tag
                          tag_name: resultsArray.name,
                          tag_topic_count: resultsArray.topic_count,
                          url:resultsArray.url
                      });

                 }
                    return datum;
              });
              processAsync(results);

            return dfd.promise();
            },function(){
                alert("网络异常");
            });
    }





  $('#search-box').typeahead({
      highlight: true,
      minLength: 1
    }, 
    {
      name: 'posts',
      displayKey: 'value',
      source: discoursePosts,
      async: true,
      templates: {
        empty: `<div class="es-empty">No matching posts.</div>`,
        footer: [
          '<div class="show-more">',
            '<a class="advanced-search" onclick="document.location.href="/search"; document.reload();" href="/search">更多...</a>',
          '<div>'
        ].join('\n'),
        suggestion: function(value) {
          if (value.post_topic_name != undefined) {
            return `
            <div class="es-dataset-posts">
              <div class="hit-post">
                <div class="hit-post-title-holder">
                  <span class="hit-post-topic-title">
                    <a href="${value.url}">${value.post_topic_name}</a>
                  </span>
                  <span class="hit-post-topic-views" title="Number of times the topic has been viewed">
                  ${value.post_topic_view}
                  </span>
                </div>
                <div class="hit-post-category-tags">
                  <span class="hit-post-category">
                    <span class="badge-wrapper bullet">
                      <span class="badge-category-bg" style="background-color: #${value.post_category_color};"></span>
                      <a class="badge-category hit-post-category-name" href="${value.post_category_url}">${value.post_category}</a>
                    </span>
                  </span>
                </div>
                <div class="hit-post-content-holder">
                <a class="hit-post-username" href="${value.post_author_url}">${value.post_author}</a>:<span class="hit-post-content">${value.post_pre}</span>
                </div>
              </div>
            </div>`
          }else{
            return '<span></span>'
            
          }
        }
      }
    },{
      name: 'users-tags',
      displayKey: 'value',
      source: discourseUsers,
      async: true,
      templates: {
        empty: "",
        suggestion: function(value) {
          if (value.user_username != undefined){
            return `
            <div class="es-dataset-users">
              <a href="${value.url}">
                <div class="hit-user-left">
                  <img class="hit-user-avatar" src="${value.user_avatar_template}" />
                </div>
                <div class="hit-user-right">
                  <div class="hit-user-username-holder">
                    <span class="hit-user-username">@${value.user_username}</span>
                    <span class="hit-user-custom-ranking" title="Number of likes the user has received">
                    <span class="hit-user-like-heart"> ❤ </span>${value.user_likes_received}</span>
                  </div>
                </div>
              </a>
            </div>`
          }else{
            return '<span></span>'  
          }
        }
      }

    },{
      name: 'emp',
      displayKey: 'value',
      source: discourseTags,
      async: true,
      templates: {
        empty: "",
        suggestion: function(value) {
          if (value.tag_name != undefined) {
            return `
            <div class="es-dataset-tags">
              <a href="${value.url}">
                <div class="hit-tag">
                  <span class="hit-tag-name">#${value.tag_name}</span>
                  <span class="hit-tag-topic_count" title="Number of topics with this tag">${value.tag_topic_count}</span>
                </div>
              </a>
            </div>`
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
    }).on({
        'typeahead:render': function (event, datum) {

          if (datum.length > 0 && Array.prototype.slice.call(arguments, 1)[2] == 'emp') {
            $('.tt-dataset-users-tags').delay(500).queue(function (next) {
              for (var _i = 0; _i < datum.length; _i++) {
                  var tags = datum[_i];
                  var $tags = $('<div class="es-dataset-tags tt-suggestion tt-selectable"><a href="'+ tags.url +'"><div class="hit-tag"><span class="hit-tag-name">#'+ tags.tag_name +' </span><span class="hit-tag-topic_count" title="Number of topics with this tag"> '+ tags.tag_topic_count +'</span></div></a></div>');
                  // Append to user-tag list.
                    $(this).append($tags);
                    next();
              }
            });
          }
          $('.tt-dataset-emp').empty();
        }
    });


    $("#search-box").on('focus', function (event) {
      $(this).select();
    });
  }
}

