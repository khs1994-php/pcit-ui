'use strict';

const css = require('../../css/profile.css');
const header = require('../common/header');
const footer = require('../common/footer');
const git = require('../common/git');
const app = require('../common/app');
const title = require('../common/title');

const ClipboardJS = require('clipboard');
const Cookies = require('js-cookie');
const handleHeader = require('../builds/handleHeader');
let url_array = location.href.split('/');
let git_type = url_array[4];
// eslint-disable-next-line no-undef
let token = Cookies.get(git_type + '_api_token');

header.show();
footer.show();

handleHeader(token, git_type);

let ci_host = 'https://' + location.host + '/';
let username = url_array[5];

const pcit = require('@pcit/pcit-js');
const pcit_system = new pcit.System(token, '');
const pcit_user = new pcit.User(token, '');
const pcit_repo = new pcit.Repo(token, '');
const pcit_org = new pcit.Org(token, '');

function settings(data: any) {
  let { username, type } = data;

  $('#username')
    .text(username)
    .addClass(type);

  let titleContent = `${git.format(git_type)} - ${username} - Profile - ${
    app.app_name
  }`;

  title.titleChange(titleContent);

  $('#user')
    .empty()
    .append(() => $('<span></span>').append(username))
    .append(() => $('<strong></strong>').append('API authentication'))
    .append(() =>
      $('<p></p>')
        .append('使用 PCIT API 请访问')
        .append(
          $('<a></a>')
            .append('https://api.ci.khs1994.com')
            .attr({
              href: 'https://api.ci.khs1994.com',
              target: '_blank',
            }),
        )
        .append(() =>
          $('<input/>').attr({
            id: 'token',
            value: token,
          }),
        )
        .append(() =>
          $('<button></button>')
            .addClass('copy_token')
            .attr({
              'data-clipboard-target': '#token',
            })
            .append('Copy'),
        ),
    );
}

$('.copy_token').on({
  click: () => {
    copyToken();
  },
});

function copyToken() {
  // eslint-disable-next-line no-undef
  let clipboard = new ClipboardJS('.copy_token');

  clipboard.on('success', function(e: any) {
    console.info('Action:', e.action);
    console.info('Text:', e.text);
    console.info('Trigger:', e.trigger);

    e.clearSelection();
  });
}

// show repos
function list_repos(reposData: any) {
  let repos_element = $('#repos');

  repos_element.empty();

  let reposArr: any[] = [];

  for (let repo of reposData) {
    repo.build_id ? reposArr.unshift(repo) : reposArr.push(repo);
  }

  $.each(reposArr, function(num: number, repo: any) {
    let repo_item_el = $('<div class="repo_item row"></div>');
    let { webhooks_status: status, repo_full_name: repo_name } = repo;

    // <p id="username/repo">username/repo</p>
    let p = $('<a class="repo_full_name col-12 col-md-8"></a>')
      .text(repo_name)
      .attr({
        repo_name: repo_name,
        href: ci_host + git_type + '/' + repo_name,
        target: '_blank',
      })
      .css('display', 'inline');

    let button = $('<i class="toggle col-6 col-md-2 material-icons"></i>')
      .addClass('open_or_close btn btn-link btn-sm')
      .attr('repo_name', repo_name);

    if (status === 1 + '') {
      button
        .text('toggle_on')
        .attr('title', 'disable')
        .css('color', 'rgb(3,102,214)');
    } else {
      button.text('toggle_off').attr('title', 'activate');
    }

    let settings = $(
      '<a class="settings material-icons col-6 col-md-2">settings</a>',
    )
      .attr('href', ci_host + [git_type, repo_name, 'settings'].join('/'))
      .attr('target', '_blank');

    // console.log('github' === git_type);

    repo_item_el
      .append(p)
      .append(() => {
        return 'github' === git_type ? '' : button;
      })
      .append(settings);

    repo_item_el.css({
      display: 'none',
    });

    repos_element.append(repo_item_el);
  });

  $('.repo_item').fadeIn(500);
}

// show org list
function showOrg(data: any) {
  $.each(data, (num: number, org: any) => {
    let { username: org_name } = org;

    $('.orgs').append(
      $('<p class="org_name"></p>')
        .append(org_name)
        .attr({
          org_name: org_name,
        }),
    );
  });

  (async () => {
    let oauth_url = await pcit_system.getOauthClientId();

    $('#miss_org').append(
      $('<p class="org_tips">找不到组织?请点击 </p>').append(
        $('<a></a>')
          .append('授权')
          .attr({
            href: oauth_url.url,
            target: '_black',
          }),
      ),
    );
  })();
}

function showGitHubAppSettings(org_name: string, installation_id: number) {
  (async () => {
    // let settings_url = await new Promise(resolve => {
    //   $.ajax({
    //     type: 'GET',
    //     url: '/api/ci/github_app_settings/' + org_name,
    //     success(data) {
    //       resolve(data);
    //     },
    //   });
    // });

    let result = await pcit_system.getGitHubAppSettingsAddress(org_name);

    let settings_url = result.url;

    $('#repos').append(() => {
      return $('<p class="repo_tips"></p>')
        .append('找不到仓库？请在 ')
        .append(() => {
          return $('<a></a>')
            .attr({
              href: `${settings_url}/${installation_id}`,
              target: '_blank',
            })
            .text('GitHub');
        })
        .append(' 添加仓库')
        .css({
          display: 'none',
        });
    });

    $('.repo_tips').fadeIn(500);
  })();
}

function showGitHubAppInstall(uid: number) {
  (async () => {
    // let installation_url = await new Promise(resolve => {
    //   $.ajax({
    //     type: 'GET',
    //     url: '/api/ci/github_app_installation/' + uid,
    //     success: function(data) {
    //       resolve(data);
    //     },
    //   });
    // });

    let result = await pcit_system.getGitHubAppInstallationAddress(uid);

    let installation_url = result.url;

    $('#repos')
      .append(
        $('<div class="card border-primary text-center repo_tips"></div>')
          .append(
            $('<div class="card-header"></div>').append(
              '此账号或组织未安装 GitHub App',
            ),
          )
          .append(
            $('<div class="card-body text-primary"></div>')
              .append($('<h5 class="card-title"></h5>'))
              .append(
                $('<p class="card-text"></p>').append(
                  '使用 PCIT 之前请先安装 GitHub App',
                ),
              )
              .append(
                $('<a class="btn btn-outline-primary">立即安装</a>').attr({
                  href: installation_url,
                  target: '_blank',
                }),
              ),
          ),
      )
      .css({
        display: 'none',
      });

    $('#repos').fadeIn(500);
  })();
}

function get_userdata(): any {
  // return new Promise(resolve => {
  //   $.ajax({
  //     type: 'GET',
  //     url: '/api/user',
  //     headers: {
  //       Authorization: 'token ' + token,
  //     },
  //     success: function(data) {
  //       resolve(data);
  //     },
  //   });
  // });

  return pcit_user.current();
}

function click_user() {
  $('#orgs .org_name').css({ 'background-color': 'white', color: 'black' });

  $('#username').css({
    'background-color': '#f4f9f9',
    color: 'rgb(3, 102, 214)',
  });
  (async () => {
    let data = await get_userdata();

    let { installation_id, uid, username, name, pic } = data[0];

    let repo_data = await get_user_repos();

    history.pushState(
      {},
      username,
      ci_host + 'profile/' + git_type + '/' + username,
    );

    $('.header_img').attr('src', pic ? pic : '/ico/pcit.png');
    $('.details_usernickname').text(name ? name : username);
    $('.details_username').text('@' + username);

    list_repos(repo_data);

    if (git_type !== 'github') {
      return;
    }

    parseInt(installation_id)
      ? showGitHubAppSettings(null, installation_id)
      : showGitHubAppInstall(uid);
  })();
}

function show_org(data: any, org_name: string) {
  if (data[0] === undefined) {
    return;
  }

  let { pic, username, name } = data[0];

  $('.header_img').attr('src', pic ? pic : '/ico/pcit.png');
  $('.details_usernickname').text(name ? name : username);
  $('.details_username').text('@' + username);

  $('.userbasicInfo').fadeIn(500);

  let { installation_id, uid } = data[0];

  (async () => {
    // let org_data = await new Promise(resolve => {
    //   $.ajax({
    //     type: 'GET',
    //     url: '/api/repos/' + git_type + '/' + org_name,
    //     headers: {
    //       Authorization: 'token ' + token,
    //     },
    //     success: function(data) {
    //       resolve(data);
    //     },
    //   });
    // });

    let org_data = await pcit_repo.listByOwner(git_type, org_name);

    history.pushState(
      {},
      org_name,
      ci_host + 'profile/' + git_type + '/' + org_name,
    );

    list_repos(org_data);

    if (git_type !== 'github') {
      return;
    }

    parseInt(installation_id)
      ? showGitHubAppSettings(org_name, installation_id)
      : showGitHubAppInstall(uid);
  })();
}

function click_org(org_name: string) {
  // $.ajax({
  //   type: 'GET',
  //   url: '/api/org/' + git_type + '/' + org_name,
  //   headers: {
  //     Authorization: 'token ' + token,
  //   },
  //   success: function(data) {
  //     show_org(data, org_name);
  //   },
  // });

  (async () => {
    let result = await pcit_user.find(git_type, org_name);

    show_org(result, org_name);
  })();
}

function get_user_repos() {
  // return new Promise(resolve => {
  //   $.ajax({
  //     type: 'GET',
  //     url: '/api/repos',
  //     headers: {
  //       Authorization: 'token ' + token,
  //     },
  //     success: function(data) {
  //       resolve(data);
  //     },
  //   });
  // });

  return pcit_repo.list();
}

$(document).ready(function() {
  (async () => {
    let data = await get_userdata();

    settings(data[0]);

    let { installation_id, username: api_username, uid } = data[0];

    if (api_username === username) {
      // $.ajax({
      //   type: 'GET',
      //   url: '/api/orgs',
      //   headers: {
      //     Authorization: 'token ' + token,
      //   },
      //
      //   success: function(data) {
      //     showOrg(data);
      //   },
      // });

      (async () => {
        let result = await pcit_org.list();

        showOrg(result);
      })();
    }

    click_user();

    if ('github' === git_type) {
      parseInt(installation_id)
        ? showGitHubAppSettings(username, installation_id)
        : showGitHubAppInstall(uid);
      return;
    }

    // let oauth_client_url = await new Promise(resolve => {
    //   $.ajax({
    //     type: 'GET',
    //     url: '/api/ci/oauth_client_id',
    //     headers: {
    //       Authorization: 'token ' + token,
    //     },
    //     success: function(data) {
    //       resolve(data);
    //     },
    //   });
    // });

    let result = await pcit_system.getOauthClientId();

    let oauth_client_url = result.url;

    $('.tip').after(
      $('<p></p>').append(
        $('<a></a>')
          .append('<button>授权</button>')
          .attr({
            href: oauth_client_url,
            target: '_blank',
          }),
      ),
    );
  })();
});

$('#sync').on('click', function() {
  $(this)
    .empty()
    .append('账户信息同步中')
    .attr('disabled', 'disabled');

  $(this).after(
    $('<div></div>')
      .addClass('progress')
      .append(
        $('<div></div>')
          .addClass('progress-bar progress-bar-striped progress-bar-animated')
          .attr({
            role: 'progressbar',
            'aria-valuenow': 10,
            'aria-valuemin': 0,
            'aria-valuemax': 100,
          })
          .css('width', '20%'),
      ),
  );

  function progress(progress: number, timeout: number) {
    setTimeout(() => {
      $('.progress-bar')
        .attr('aria-valuenow', progress)
        .css('width', progress + '%');
    }, timeout);
  }

  // $.ajax({
  //   type: 'POST',
  //   url: '/api/user/sync',
  //   headers: {
  //     Authorization: 'token ' + token,
  //   },
  //   success: function(data) {
  //     location.reload();
  //     // console.log(data);
  //   },
  // });

  (async () => {
    let result = await pcit_user.sync();
    location.reload();
  })();

  progress(20, 2000);
  progress(40, 10000);
  progress(80, 15000);
  progress(97, 30000);
});

$(document).on('click', '.org_name', function() {
  $('#username').css({ 'background-color': 'white', color: 'black' });

  $('#orgs .org_name').css({ 'background-color': 'white', color: 'black' });

  $(this).css({ 'background-color': '#f4f9f9', color: 'rgb(3, 102, 214)' });
  click_org($(this).attr('org_name'));
});

$('#userinfo').click(function(event) {
  let username = event.target.innerHTML;
  click_user();
});

// append 添加元素绑定事件
// https://www.cnblogs.com/liubaojing/p/8383960.html
$('#repos').on('click', '.open_or_close', function() {
  let status = $(this).text();
  let repo = $(this).attr('repo_name');
  let that = $(this);

  if ('toggle_on' === status) {
    $.ajax({
      type: 'DELETE',
      url: ci_host + 'webhooks/' + git_type + '/' + repo + '/deactivate',
      dataType: 'json',
      contentType: 'application/json;charset=utf-8',
      success(data) {
        that
          .text('toggle_off')
          .css('color', 'black')
          .attr('title', 'activate');
        // console.log(data);
      },
    });
  } else {
    $.ajax({
      type: 'POST',
      url: ci_host + 'webhooks/' + git_type + '/' + repo + '/activate',
      success(data) {
        that
          .text('toggle_on')
          .css('color', 'rgb(3,102,214)')
          .attr('title', 'disable');
        // console.log(data);
      },
    });
  }
});
