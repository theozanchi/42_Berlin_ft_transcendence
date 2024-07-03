from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import UserProfile, Tournament, Participation
from django.utils.html import format_html

class UserProfileInline(admin.TabularInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'UserProfiles'
    fields = ('picture_url', 'access_token')
    readonly_fields = ('access_token',)

class ParticipationInline(admin.TabularInline):
    model = Participation
    extra = 1

class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline, ParticipationInline,)
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (('Personal info'), {'fields': ('first_name', 'last_name', 'email', 'picture_url')}),
        (('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        (('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    readonly_fields = ('picture_url',)

    def picture_url(self, obj):
        return format_html('<img src="{}" style="height: 100px" />', obj.userprofile.picture_url)
    picture_url.short_description = 'Picture URL'


class TournamentAdmin(admin.ModelAdmin):
    inlines = (ParticipationInline,)
    list_display = ('game_id', 'start_date', 'end_date', 'mode_is_local', 'winner')
    list_filter = ('start_date', 'end_date', 'mode_is_local')
    search_fields = ('game_id', 'winner')
    ordering = ('start_date',)

admin.site.unregister(User)
admin.site.register(User, UserAdmin)
admin.site.register(Tournament, TournamentAdmin)
admin.site.register(Participation)

admin.site.site_header = "Transcendence User Management"
admin.site.site_title = "Transcendence User Management"
admin.site.index_title = "Transcendence User Management"