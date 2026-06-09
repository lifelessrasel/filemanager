<?php

use App\Vito\Plugins\Lifelessrasel\Filemanager\Http\Controllers\FileManagerController;
use Illuminate\Support\Facades\Route;

Route::prefix('servers/{server}/sites/{site}/filemanager')->group(function (): void {
    Route::get('/', [FileManagerController::class, 'index'])->name('site-filemanager');
    Route::get('/entries', [FileManagerController::class, 'entries'])->name('site-filemanager.entries');
    Route::get('/content', [FileManagerController::class, 'content'])->name('site-filemanager.content');
    Route::put('/content', [FileManagerController::class, 'updateContent'])->name('site-filemanager.content.update');
    Route::post('/files', [FileManagerController::class, 'createFile'])->name('site-filemanager.files.store');
    Route::post('/directories', [FileManagerController::class, 'createDirectory'])->name('site-filemanager.directories.store');
    Route::post('/upload', [FileManagerController::class, 'upload'])->name('site-filemanager.upload');
    Route::get('/download', [FileManagerController::class, 'download'])->name('site-filemanager.download');
    Route::delete('/entries', [FileManagerController::class, 'destroy'])->name('site-filemanager.entries.destroy');
    Route::post('/extract', [FileManagerController::class, 'extract'])->name('site-filemanager.extract');
    Route::post('/rename', [FileManagerController::class, 'rename'])->name('site-filemanager.rename');
    Route::post('/copy', [FileManagerController::class, 'copy'])->name('site-filemanager.copy');
    Route::post('/compress', [FileManagerController::class, 'compress'])->name('site-filemanager.compress');
});
