# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'FacebookAccount'
        db.create_table('facebook_facebookaccount', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('facebookId', self.gf('django.db.models.fields.CharField')(max_length=64)),
        ))
        db.send_create_signal('facebook', ['FacebookAccount'])

        # Adding model 'FacebookPhotoPlugin'
        db.create_table('cmsplugin_facebookphotoplugin', (
            ('cmsplugin_ptr', self.gf('django.db.models.fields.related.OneToOneField')(to=orm['cms.CMSPlugin'], unique=True, primary_key=True)),
            ('account', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['facebook.FacebookAccount'])),
        ))
        db.send_create_signal('facebook', ['FacebookPhotoPlugin'])


    def backwards(self, orm):
        
        # Deleting model 'FacebookAccount'
        db.delete_table('facebook_facebookaccount')

        # Deleting model 'FacebookPhotoPlugin'
        db.delete_table('cmsplugin_facebookphotoplugin')


    models = {
        'cms.cmsplugin': {
            'Meta': {'object_name': 'CMSPlugin'},
            'creation_date': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'language': ('django.db.models.fields.CharField', [], {'max_length': '15', 'db_index': 'True'}),
            'level': ('django.db.models.fields.PositiveIntegerField', [], {'db_index': 'True'}),
            'lft': ('django.db.models.fields.PositiveIntegerField', [], {'db_index': 'True'}),
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['cms.CMSPlugin']", 'null': 'True', 'blank': 'True'}),
            'placeholder': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['cms.Placeholder']", 'null': 'True'}),
            'plugin_type': ('django.db.models.fields.CharField', [], {'max_length': '50', 'db_index': 'True'}),
            'position': ('django.db.models.fields.PositiveSmallIntegerField', [], {'null': 'True', 'blank': 'True'}),
            'rght': ('django.db.models.fields.PositiveIntegerField', [], {'db_index': 'True'}),
            'tree_id': ('django.db.models.fields.PositiveIntegerField', [], {'db_index': 'True'})
        },
        'cms.placeholder': {
            'Meta': {'object_name': 'Placeholder'},
            'default_width': ('django.db.models.fields.PositiveSmallIntegerField', [], {'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'slot': ('django.db.models.fields.CharField', [], {'max_length': '50', 'db_index': 'True'})
        },
        'facebook.facebookaccount': {
            'Meta': {'object_name': 'FacebookAccount'},
            'facebookId': ('django.db.models.fields.CharField', [], {'max_length': '64'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'})
        },
        'facebook.facebookphotoplugin': {
            'Meta': {'object_name': 'FacebookPhotoPlugin', 'db_table': "'cmsplugin_facebookphotoplugin'", '_ormbases': ['cms.CMSPlugin']},
            'account': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['facebook.FacebookAccount']"}),
            'cmsplugin_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': "orm['cms.CMSPlugin']", 'unique': 'True', 'primary_key': 'True'})
        }
    }

    complete_apps = ['facebook']
