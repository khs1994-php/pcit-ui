const status = require('../../common/status');
const git = require('../../common/git');
const error_info = require('../error/error').error_info;

import pcit from '@pcit/pcit-js';
import time_ago_icon from '../../icon/time_ago';
import commit_message_icon from '../../icon/commit_message';

function display(data, url, append = false) {
  let display_element = $('#display');

  !append && display_element.empty();

  // let requests_el = $('<div class="requests"></div>');

  if (data.length === 0) {
    display_element
      .hide()
      .append(error_info('Not Event receive !'))
      .fadeIn(500);
    // display_element.innerHeight(55);

    return;
  }

  // display_element.innerHeight(60 + data.length * 30);

  let requests_el = append
    ? $('.requests_list')
    : $('<div class="requests_list"></div>');

  $.each(data, (key, value) => {
    let requests_el_item = $('<div class="row requests_list_item"></div>');

    let {
      id,
      branch,
      commit_id,
      tag,
      commit_message,
      build_status,
      event_type,
      pull_request_number,
      created_at,
    } = value;

    if (!commit_id) {
      return;
    }

    commit_message = tag ? tag : commit_message;

    let color =
      build_status === 'skip'
        ? status.getColor('error')
        : status.getColor('success');

    const className =
      build_status === 'skip' ||
      build_status === 'skipped' ||
      build_status === 'misconfigured'
        ? 'errored'
        : 'passed';

    requests_el_item
      // .addClass(className)
      .attr({
        'data-id': id,
      })
      .append($('<div class="status_bar"></div>').addClass(className))
      .append(
        $('<div class="event_type col-md-1"></div>').append(
          event_type === 'pull_request' ? 'pr' : event_type,
        ),
      )
      .append(() => {
        return $('<div class="branch col-md-1 text-truncate"></div>')
          .append(branch.substring(0, 10))
          .attr('title', branch)
          .css('color', color);
      })
      .append(() => {
        let commit_url = [
          git.getCommitUrl(
            url.getUsername(),
            url.getRepo(),
            commit_id,
            url.getGitType(),
          ),
        ].join('/');

        return $('<a class="commit_id col-md-1 text-truncate"></a>')
          .append(commit_id.substring(0, 8))
          .attr({
            title: 'View commit on GitHub',
            href: commit_url,
            target: '_blank',
          })
          .css('color', color);
      })
      .append(() => {
        let date = new Date();

        let time = (date.valueOf() / 1000 - created_at) / 24 / 60 / 60;

        let day = time > 1 ? Math.round(time) : '1';

        return $('<div class="created_at col-md-2"> </div>')
          .append(time_ago_icon)
          .append(day + ' days ago')
          .attr('title', new Date(created_at * 1000).toLocaleString());
      })
      .append(() => {
        return $('<div class="commit_message col-md-3 text-truncate"> </div>')
          .append(commit_message_icon)
          .append(commit_message)
          .attr('title', commit_message);
      })
      .append(() => {
        let build_id_url =
          '/' +
          [url.getGitType(), url.getRepoFullName(), 'builds', id].join('/');

        return $('<a class="build_id col-md-1"></a>')
          .append('# ' + id)
          .css({
            'white-space': 'nowrap',
          })
          .attr({
            title: 'Go to the build this request triggered',
            href: build_id_url,
          });
      })
      .append(() => {
        let message =
          build_status === 'skip'
            ? 'Build skipped via commit message or repo settings'
            : build_status === 'skipped'
            ? 'Build skipped via commit message or repo settings'
            : build_status === 'misconfigured'
            ? '.pcit.yml is misconfigured, please check your repo .pcit.yml file'
            : 'Build created successfully';
        return $('<div class="reason col-md-3 text-truncate"></div>')
          .append(message.substring(0, 26))
          .attr({ title: message });
      });

    requests_el_item.css({
      display: 'none',
    });

    requests_el.append(requests_el_item);
  });

  if (append) {
    $('.requests_list_item').fadeIn(500);
    return;
  }

  display_element.append(requests_el).append(
    $('<button class="requests_list_more btn">More</button>')
      .addClass('btn-success')
      .attr({
        title: '点击加载更多',
      }),
  );

  $('.requests_list_item').fadeIn(500);
}

export default {
  handle: (url, token) => {
    // $.ajax({
    //   type: 'get',
    //   url: '/api/repo/' + url.getGitRepoFullName() + '/requests',
    //   headers: {
    //     Authorization: 'token ' + token.getToken(url.getGitType()),
    //   },
    //   success: function(data) {
    //     display(data, url);
    //   },
    //   error: () => {
    //     display('', url);
    //   },
    // });

    const repo = new pcit(token, '').repo;

    (async () => {
      try {
        const result = await repo.requests.list(
          url.getGitType(),
          url.getRepoFullName(),
        );
        display(result, url);
      } catch (e) {
        console.log(e);
        display('', url);
      }
    })();
  },

  more(url, token, before, request = true) {
    const repo = new pcit(token, '').repo;

    (async () => {
      try {
        if (!request) {
          throw new Error('');
        }

        result = await repo.requests.list(
          url.getGitType(),
          url.getRepoFullName(),
          undefined,
          before,
        );

        display(result, url, true);
      } catch (e) {
        alert('没有了哦');

        $('.requests_list_more')
          .attr({
            disabled: 'true',
          })
          .removeClass('btn-success')
          .addClass('btn-light')
          .text('没有了哦');
      }
    })();
  },
};
