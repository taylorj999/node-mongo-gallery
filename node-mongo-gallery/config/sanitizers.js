var sanitizers = {};

//standard is alphanumeric, '-','_' and '.'
sanitizers.standard = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890\\-_\\.';
//allow_spaces is for the search parameter field, since search tags are space separated
sanitizers.allow_spaces = ' ' + sanitizers.standard;
//be a bit more generous in comment fields
sanitizers.comments = ', ;&' + sanitizers.standard;

module.exports = sanitizers;