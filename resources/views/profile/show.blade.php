<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Paramètres du profil') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="lg:grid lg:grid-cols-12 lg:gap-x-5">
                <!-- Sidebar Navigation -->
                <aside class="py-6 px-2 sm:px-6 lg:col-span-3 lg:py-0 lg:px-0">
                    <nav class="space-y-1" aria-label="Sidebar">
                        <!-- Onglet Informations du profil -->
                        <a href="#" data-target="profile-info-panel" class="sidebar-tab bg-gray-50 text-brand-green hover:bg-gray-100 group rounded-md px-3 py-2 flex items-center text-sm font-medium" aria-current="page">
                            <svg class="text-gray-400 group-hover:text-gray-500 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                            </svg>
                            Informations du profil
                        </a>

                        <!-- Onglet Mot de passe -->
                        <a href="#" data-target="password-panel" class="sidebar-tab text-gray-700 hover:text-brand-green hover:bg-gray-50 group rounded-md px-3 py-2 flex items-center text-sm font-medium">
                            <svg class="text-gray-400 group-hover:text-gray-500 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                            </svg>
                            Mot de passe
                        </a>

                        <!-- Onglet Supprimer le compte -->
                        <a href="#" data-target="delete-account-panel" class="sidebar-tab text-gray-700 hover:text-red-600 hover:bg-red-50 group rounded-md px-3 py-2 flex items-center text-sm font-medium">
                            <svg class="text-gray-400 group-hover:text-red-500 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                            </svg>
                            Supprimer le compte
                        </a>
                    </nav>
                </aside>

                <!-- Main Content Area -->
                <div id="main-content" class="space-y-6 sm:px-6 lg:col-span-9 lg:px-0">
                    <!-- Panel 1: Informations du profil (visible par défaut) -->
                    <section id="profile-info-panel" class="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                        <div class="max-w-xl">
                            @include('profile.partials.update-profile-information-form')
                        </div>
                    </section>

                    <!-- Panel 2: Mot de passe (caché par défaut) -->
                    <section id="password-panel" class="hidden p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                        <div class="max-w-xl">
                            @include('profile.partials.update-password-form')
                        </div>
                    </section>

                    <!-- Panel 3: Supprimer le compte (caché par défaut) -->
                    <section id="delete-account-panel" class="hidden p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                        <div class="max-w-xl">
                            @include('profile.partials.delete-user-form')
                        </div>
                    </section>
                </div>
            </div>
        </div>
    </div>

    <!-- Script pour gérer le changement d'onglets -->
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            const tabLinks = document.querySelectorAll('.sidebar-tab');
            const panels = document.querySelectorAll('#main-content > section');

            tabLinks.forEach(link => {
                link.addEventListener('click', function (event) {
                    event.preventDefault();

                    const targetId = this.getAttribute('data-target');

                    panels.forEach(panel => panel.classList.add('hidden'));

                    tabLinks.forEach(l => {
                        l.classList.remove('bg-gray-50', 'text-brand-green');
                        l.classList.add('text-gray-700');
                        l.removeAttribute('aria-current');
                    });

                    const targetPanel = document.getElementById(targetId);
                    if (targetPanel) {
                        targetPanel.classList.remove('hidden');
                    }

                    this.classList.remove('text-gray-700');
                    this.classList.add('bg-gray-50', 'text-brand-green');
                    this.setAttribute('aria-current', 'page');
                });
            });
        });
    </script>
</x-app-layout>