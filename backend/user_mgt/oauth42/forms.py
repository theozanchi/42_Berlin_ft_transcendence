from django import forms
from django.contrib.auth.forms import PasswordChangeForm, UserCreationForm
from django.contrib.auth.models import User

from .models import UserProfile


class RegistrationForm(UserCreationForm):
    email = forms.EmailField()
    avatar = forms.ImageField(required=False)

    class Meta:
        model = User
        fields = ["username", "email", "password1", "password2", "avatar"]


class UserForm(forms.ModelForm):
    avatar = forms.ImageField(required=False)

    class Meta:
        model = User
        fields = ["username", "email", "first_name", "last_name", "avatar"]

    def save(self, commit=True):
        user = super(UserForm, self).save(commit=False)

        avatar = self.cleaned_data.get("avatar")

        if avatar:
            user.avatar.save(avatar.name, avatar)
        if commit:
            user.save()

        return user
