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
    Route::post('/move', [FileManagerController::class, 'move'])->name('site-filemanager.move');
    Route::post('/compress', [FileManagerController::class, 'compress'])->name('site-filemanager.compress');
    Route::post('/permissions', [FileManagerController::class, 'permissions'])->name('site-filemanager.permissions');
    Route::post('/bulk/delete', [FileManagerController::class, 'bulkDestroy'])->name('site-filemanager.bulk.destroy');
    Route::post('/bulk/copy', [FileManagerController::class, 'bulkCopy'])->name('site-filemanager.bulk.copy');
    Route::post('/bulk/move', [FileManagerController::class, 'bulkMove'])->name('site-filemanager.bulk.move');
    Route::post('/bulk/extract', [FileManagerController::class, 'bulkExtract'])->name('site-filemanager.bulk.extract');
    Route::post('/bulk/compress', [FileManagerController::class, 'bulkCompress'])->name('site-filemanager.bulk.compress');
});
