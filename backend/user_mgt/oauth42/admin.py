from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.utils.html import format_html

from .models import Participation, Game, Player, Round


class PlayerInline(admin.TabularInline):
    model = Player
    can_delete = False
    verbose_name_plural = "Players"
    fields = ("avatar", "access_token", "id42")
    readonly_fields = ("access_token", "id42")

    def delete_model(self, request, obj):
        # delete the avatar file
        obj.picture_url.delete(save=False)
        super().delete_model(request, obj)

    def delete_queryset(self, request, queryset):
        # delete the avatar files
        for obj in queryset:
            obj.picture_url.delete(save=False)
        super().delete_queryset(request, queryset)


class ParticipationInline(admin.TabularInline):
    model = Participation
    extra = 1


class UserAdmin(BaseUserAdmin):
    inlines = (
        PlayerInline,
        ParticipationInline,
    )
    readonly_fields = (
        "last_login",
        "date_joined",
        "picture_url",
        "id42",
        "list_of_friends",
    )
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (
            ("Personal info"),
            {"fields": ("id42", "list_of_friends")},
        ),
        (
            ("Permissions"),
            {"fields": ("is_superuser",)},
        ),
        (("Important dates"), {"fields": ("last_login", "date_joined")}),
    )
    list_display = (
        "username",
        "id",
        "list_of_friends",
    )

    def picture_url(self, obj):
        return format_html(
            '<img src="{}" style="height: 100px" />', obj.player.picture_url
        )

    picture_url.short_description = "Picture URL"

    def id42(self, obj):
        return obj.player.id42

    id42.short_description = "42 ID"

    def list_of_friends(self, obj):
        return ", ".join([str(friend.username) for friend in obj.player.friends.all()])

    list_of_friends.short_description = "Friends list"


class TournamentAdmin(admin.ModelAdmin):
    inlines = (ParticipationInline,)
    list_display = ("game_id", "start_date", "end_date", "mode", "winner")
    list_filter = ("start_date", "end_date", "mode")
    search_fields = ("game_id", "winner")
    ordering = ("start_date",)


class ParticipationAdmin(admin.ModelAdmin):
    # Your admin configuration here

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # Custom queryset adjustments here, if needed
        return qs


admin.site.unregister(User)
admin.site.register(User, UserAdmin)
admin.site.register(Game, TournamentAdmin)
admin.site.register(Participation, ParticipationAdmin)
admin.site.register(Round)


admin.site.site_header = "Transcendence User Management"
admin.site.site_title = "Transcendence User Management"
admin.site.index_title = "Transcendence User Management"
