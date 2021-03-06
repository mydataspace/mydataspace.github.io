---
layout: features/index
title: Features
language: en
---
**MyDataSpace** is a cloud storage of open data with API access.

The API allows you to:
* full-text search
* filter, sort, group data
* authorize users through social networks
* receive notification of data changes
* store files and much more.

MyDataSpace provides open access to all stored data.

{% for demo in site.data[page.language].features %}
  <section class="page__section">
    <div class="row">
      <div class="col-md-4">
        {% if demo.super_title %}
          <h2 id="{{ demo.id }}" class="margin-top-0">{{ demo.super_title }}</h2>
          <p>{{ demo.super_description }}</p>
        {% endif %}
        {% if demo.title %}
          <p class="feature__subtitle">{{ demo.title }}</p>
          <p>{{ demo.description }}</p>
        {% endif %}

      {% include links.html links=demo %}
      </div>
      <div class="col-md-8">
          {% if demo.content %}
          <p>
            {{ demo.content | markdownify }}
          </p>
          {% endif %}

          {% assign section_media_id = demo.id | append:"__" | append:demo.code_id %}

          {% case demo.type %}
          {% when "image" %}
            <img class="width-100" id="{{ section_media_id }}" />
            {% include image_waiter.html id=section_media_id width="1130" height="683" url=section.url %}


          {% when "video_demo" %}
            <div class="safari">
              <div class="safari__header clearfix">
                <div class="safari__buttons_wrap">
                  <div class="safari__buttons clearfix">
                    <div class="safari__button safari__button--red"></div>
                    <div class="safari__button safari__button--orange"></div>
                    <div class="safari__button safari__button--green"></div>
                  </div>
                </div>
                <div class="safari__address_bar">
                  <div class="safari__url">{{ demo.website | replace: "https://","<span class='safari__url__https'>https://</span>" }}</div>
                </div>
              </div>
              <video id="{{ section_media_id }}" class="safari__video" autoplay loop>
                <source src="{{ demo.video_url }}" type="video/mp4" />
              </video>
              {% include video_waiter.html id=section_media_id width=demo.width height=demo.height url=demo.preview_url %}
            </div>


          {% when "demo" %}
            <div class="safari">
              <div class="safari__header clearfix">
                <div class="safari__buttons_wrap">
                  <div class="safari__buttons clearfix">
                    <div class="safari__button safari__button--red"></div>
                    <div class="safari__button safari__button--orange"></div>
                    <div class="safari__button safari__button--green"></div>
                  </div>
                </div>
                <div class="safari__address_bar">
                  <div class="safari__url">{{ demo.website | replace: "https://","<span class='safari__url__https'>https://</span>" }}</div>
                </div>
              </div>
              <div style="margin-right: -2px; margin-bottom: -2px">
                <img class="safari__img" id="{{ section_media_id }}" src="{{ demo.image_url }}" />
              </div>
            </div>

          {% when "code" %}
            <iframe id='{{ section_media_id }}'
                    height='{{ demo.height }}'
                    scrolling='no'
                    src='//codepen.io/mydataspace/embed/{{ demo.code_id }}/?height={{ demo.height }}&theme-id=0&default-tab=result&embed-version=2'
                    frameborder='no'
                    allowtransparency='true'
                    allowfullscreen='true'
                    style='width: 100%;'>
              See the Pen <a href='https://codepen.io/mydataspace/pen/{{ demo.code_id }}/'>Reading data from service</a> by MyDataSpace (<a href='http://codepen.io/mydataspace'>@mydataspace</a>) on <a href='http://codepen.io'>CodePen</a>.
            </iframe>
            {% include waiter.html id=section_media_id %}

          {% when "youtube" %}
            <iframe height="{{ demo.height }}"
                    width="100%"
                    src="https://www.youtube.com/embed/{{ demo.video_id }}?rel=0&amp;showinfo=0&amp;autoplay=1&amp;loop=1&amp;color=white"
                    frameborder="0"
                    allowfullscreen
                    style='width: 100%; border: 1px solid black;'></iframe>

          {% when "iframe" %}
            <iframe id='{{ section_media_id }}'
                    height='{{ demo.height }}'
                    scrolling='no'
                    src='{{ demo.url }}'
                    frameborder='no'
                    allowtransparency='true'
                    allowfullscreen='true'
                    style='width: 100%; border: 1px solid black;'>
            </iframe>
            {% include waiter.html id=section_media_id %}
          {% endcase %}


      </div>
    </div>

  </section>
{% endfor %}