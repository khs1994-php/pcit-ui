const { column_span_click } = require('../common');
const error_info = require('../error/error').error_info;

function display(data) {
  let display_element = $('#display')
    .empty()
    .hide();

  if (0 === data.length) {
    display_element
      .append(error_info('Not Build Yet !', '', '', 'primary'))
      .fadeIn(1000);
    // display_element.innerHeight(55);
  } else {
    // console.log(data);

    // display_element.innerHeight(data.length * 20);

    $.each(data, function(num, branch) {
      display_element.append(branch);

      $.each(status, function(id, status) {
        id = id.replace('k', '');

        let stopped_at = status[3];

        if (null == stopped_at) {
          stopped_at = 'Pending';
        } else {
          let d;
          d = new Date(stopped_at * 1000);
          stopped_at = d.toLocaleString();
        }

        display_element.append(`<tr>
<td><a href="" target='_blank'># ${id} </a></td>
<td>${status[0]}</td>
<td>${status[2]}</td>
<td>${stopped_at}</td>
<td><a href="${status[4]}" target='_black'>${status[1]}</a></td>
</tr>
`);
      });

      display_element.append('<hr>');
    });

    // display_element.slideDown(1000);
    display_element.fadeIn(1000);
  }
}

module.exports = {
  handle: url => {
    column_span_click('branches');
    const pcit = require('@pcit/pcit-js');
    const repo = new pcit.Repo('', '/api');

    (async () => {
      try {
        let data = await repo.branches.list(
          url.getGitType(),
          url.getRepoFullName(),
        );
        display(data);
      } catch (e) {
        display('');
      }
    })();
  },
};
