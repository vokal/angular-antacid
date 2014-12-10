
angular
    .module( "antacid", [] )
    .provider( "Antacid", function ()
    {
        var options = {
            when: {
                long: { min: 75, max: 60000 },
                frequent: { perMs: 1000, hits: 20 },
                events: [
                    "ontouchstart" in window ? "touchstart" : "mousedown",
                    "input"
                ]
            },
            to: {
                googleAnalytics: true,
                console: false
            },
            with: {
                dataAttributeValues: false
            },
            tracking: false
        };

        this.options = options;

        this.$get = [ "$rootScope", "$window",
        function ( $rootScope, $window )
        {
            "use strict";

            var digested = [];
            var start = null;
            var check = 0;
            var tracks = [];

            var track = function ( name )
            {
                tracks.unshift( {
                    type: "custom",
                    trigger: name
                } );
            };

            track( "Initial Page Load" );

            angular.element( $window ).bind( options.when.events.join( " " ), function ( e )
                {
                    tracks.unshift( {
                        type: "dom",
                        trigger: e.type,
                        target: e.target
                    } );
                } );

            var domDescription = function ( element )
            {
                var tag = [ element.localName ];
                var attrs = element.attributes;
                for( var attr = 0; attr < attrs.length; attr++ )
                {
                    var print = attrs[ attr ].localName;

                    if( options.with.dataAttributeValues || !/^data-/.test( attrs[ attr ].localName ) )
                    {
                        print += "=\"" + attrs[ attr ].nodeValue + "\"";
                    }
                    tag.push( print );
                }

                return( "<" + tag.join( " " ) + " />" );
            };

            var log = function ( trackFor, elapsed )
            {
                var customs = [];
                var doms = [];

                if( tracks.length )
                {
                    tracks.forEach( function ( item )
                    {
                        if ( !doms.length && item.type === "dom" )
                        {
                            var eventName = item.trigger;
                            if ( eventName === "touchstart" || eventName == "mousedown" )
                            {
                                eventName = "touchstart/mousedown";
                            }

                            doms.push( eventName.toUpperCase() + ": " + domDescription( item.target ) );
                        }
                        else if ( item.type === "custom" )
                        {
                            if ( customs.indexOf( item.trigger ) === -1 )
                            {
                                customs.push( item.trigger );
                            }
                        }
                    } );
                }

                customs.sort();
                var detail = doms.concat( customs ).join( ", " )
                    || "No DOM or Custom events tracked; is code using "
                       + "$timeout, $interval, or getting network calls? " + digested[ 0 ].stack;

                if ( options.to.console )
                {
                    console.log( trackFor, elapsed + "ms", detail );
                }
                if ( "ga" in window && options.to.googleAnalytics )
                {
                    ga( "send", "timing", "antacid", trackFor, elapsed, detail );
                }
            };

            var calculate = function ()
            {
                var trackFor = null;
                var last = digested[ 0 ];
                var elapsed = 0;

                if ( last.elapsed > options.when.long.min && last.elapsed < options.when.long.max )
                {
                    trackFor = "long";
                    digested[ 0 ].trackedFor = trackFor;
                    elapsed = last.elapsed;
                }
                else
                {
                    var hits = digested[ options.when.frequent.hits ];
                    if ( hits && !hits.trackedFor && start - hits.start < options.when.frequent.perMs )
                    {
                        trackFor = "frequent";
                        for( var index = 0; index <  options.when.frequent.hits; index++ )
                        {
                            digested[ index ].trackedFor = trackFor;
                            elapsed += digested[ index ].elapsed;
                        }
                    }
                }

                if( trackFor )
                {
                    log( trackFor, elapsed );
                    tracks = [];
                }
            };

            $rootScope.$watch( function ()
                {
                    return ( check );
                },
                function( newValue, oldValue )
                {
                    if( options.tracking )
                    {
                        if ( newValue !== oldValue )
                        {
                            start = Date.now();
                            $rootScope.$$postDigest( function ()
                            {
                                digested.unshift( {
                                    start: start,
                                    elapsed: Date.now() - start,
                                    stack: ( new Error() ).stack
                                } );

                                calculate();

                                start = null;
                                check++;
                            } );
                        }
                        else if ( start === null )
                        {
                            check++;
                        }
                    }
                } );

            return {
                options: options,
                track: track,
                start: function ()
                {
                    options.tracking = true;
                },
                stop: function ()
                {
                    options.tracking = false;
                    tracks = [];
                    start = null;
                    check = 0;
                }
            };

        } ];
    } );
