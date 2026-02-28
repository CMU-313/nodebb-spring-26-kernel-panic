<!-- shows list of users who responded to this topic -->
{{{ if respondents.length }}}
<div component="topic/respondents">
	<h6 class="fw-semibold text-xs text-uppercase text-muted mb-2">[[topic:respondents]]</h6>
	<div class="d-flex flex-column gap-1">
		{{{ each respondents }}}
		<a href="{config.relative_path}/user/{respondents.userslug}" class="d-flex align-items-center gap-2 text-decoration-none text-reset">
			{buildAvatar(respondents, "24px", true)}
			<span class="text-sm">{respondents.username}</span>
		</a>
		{{{ end }}}
	</div>
</div>
{{{ end }}}